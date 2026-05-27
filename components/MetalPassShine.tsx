import NativeScript, { defineUIKitView } from '@nativescript/react-native';
import { loadSystemFramework } from '../utils/ns';
import { logWarning } from '../utils/logger';

export const PASS_SHINE_WIDTH = 320;
export const PASS_SHINE_HEIGHT = 704;

type MetalShineView = UIView & {
  nativeResources?: MetalShineResources;
  nativeFallbackLayers?: CALayer[];
};

type MetalShineResources = {
  commandQueue: MTLCommandQueue;
  pipeline: MTLRenderPipelineState;
  uniforms: NSMutableData;
  startTime?: number;
};

const nativeScriptReady = NativeScript.init();

export const NativeMetalPassShine = defineUIKitView<{}, MetalShineView>({
  name: 'NativeMetalPassShine',
  layout: {
    sizing: 'fill',
    defaultSize: { width: PASS_SHINE_WIDTH, height: PASS_SHINE_HEIGHT },
  },
  create() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    try {
      return createMetalShineView();
    } catch (error) {
      logWarning(
        `Metal shine unavailable, using Core Animation fallback: ${String(error)}`,
      );
      return createFallbackShineView();
    }
  },
  dispose(view) {
    if ('paused' in view) {
      (view as MTKView).paused = true;
    }

    view.nativeFallbackLayers?.forEach((layer) => layer.removeFromSuperlayer());
    view.nativeFallbackLayers = undefined;
    view.nativeResources = undefined;
  },
});

function createMetalShineView() {
  loadSystemFramework('Metal');
  loadSystemFramework('MetalKit');

  const device = MTLCreateSystemDefaultDevice();
  if (!device) {
    throw new Error('Metal is not available on this device.');
  }

  const view = MTKView.alloc().initWithFrameDevice({
    origin: { x: 0, y: 0 },
    size: { width: PASS_SHINE_WIDTH, height: PASS_SHINE_HEIGHT },
  }, device) as MTKView & MetalShineView;

  view.backgroundColor = UIColor.clearColor;
  view.clearColor = transparentMetalColor();
  view.colorPixelFormat = MTLPixelFormat.BGRA8Unorm;
  view.framebufferOnly = true;
  view.opaque = false;
  view.paused = true;
  view.enableSetNeedsDisplay = true;
  view.userInteractionEnabled = false;

  const resources = createMetalShineResources(device);
  view.nativeResources = resources;

  drawMetalShine(resources, view);

  return view;
}

function createFallbackShineView() {
  const view = UIView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: PASS_SHINE_WIDTH, height: PASS_SHINE_HEIGHT },
  }) as MetalShineView;
  view.backgroundColor = UIColor.clearColor;
  view.userInteractionEnabled = false;

  const layer = CAGradientLayer.layer() as CAGradientLayer;
  layer.frame = view.bounds;
  layer.startPoint = { x: 0, y: 0.5 };
  layer.endPoint = { x: 1, y: 0.5 };
  layer.colors = [
    nativeColor(255, 255, 255, 0).CGColor,
    nativeColor(116, 190, 255, 0.14).CGColor,
    nativeColor(255, 255, 255, 0.72).CGColor,
    nativeColor(255, 230, 170, 0.48).CGColor,
    nativeColor(255, 255, 255, 0).CGColor,
  ];
  layer.locations = [0, 0.28, 0.5, 0.6, 1];
  view.layer.addSublayer(layer);
  view.nativeFallbackLayers = [layer];

  return view;
}

function createMetalShineResources(device: MTLDevice) {
  const pipelineError = new interop.Reference();
  const library = device.newLibraryWithSourceOptionsError(
    METAL_SHINE_SHADER,
    null,
    pipelineError,
  );

  if (!library) {
    throw new Error(describeNativeError(pipelineError.value));
  }

  const descriptor = MTLRenderPipelineDescriptor.new();
  descriptor.vertexFunction = library.newFunctionWithName('pass_vertex');
  descriptor.fragmentFunction = library.newFunctionWithName('pass_fragment');

  const attachment = descriptor.colorAttachments.objectAtIndexedSubscript(0);
  attachment.pixelFormat = MTLPixelFormat.BGRA8Unorm;
  attachment.blendingEnabled = true;
  attachment.sourceRGBBlendFactor = MTLBlendFactor.SourceAlpha;
  attachment.destinationRGBBlendFactor = MTLBlendFactor.One;
  attachment.rgbBlendOperation = MTLBlendOperation.Add;
  attachment.sourceAlphaBlendFactor = MTLBlendFactor.One;
  attachment.destinationAlphaBlendFactor = MTLBlendFactor.OneMinusSourceAlpha;
  attachment.alphaBlendOperation = MTLBlendOperation.Add;

  const renderPipelineError = new interop.Reference();
  const pipeline = device.newRenderPipelineStateWithDescriptorError(
    descriptor,
    renderPipelineError,
  );

  if (!pipeline) {
    throw new Error(describeNativeError(renderPipelineError.value));
  }

  return {
    commandQueue: device.newCommandQueue(),
    pipeline,
    uniforms: NSMutableData.dataWithLength(16) as NSMutableData,
    startTime: Date.now() / 1000,
  };
}

function drawMetalShine(resources: MetalShineResources, view: MTKView) {
  const descriptor = view.currentRenderPassDescriptor;
  const drawable = view.currentDrawable;

  if (!descriptor || !drawable) {
    throw new Error('MTKView did not provide a drawable.');
  }

  const width = Math.max(view.drawableSize.width, 1);
  const height = Math.max(view.drawableSize.height, 1);
  const values = new Float32Array(interop.bufferFromData(resources.uniforms));
  values[0] = Date.now() / 1000 - (resources.startTime ?? 0);
  values[1] = width / height;
  values[2] = 1.15;
  values[3] = 0.37;

  const colorAttachment = descriptor.colorAttachments.objectAtIndexedSubscript(0);
  colorAttachment.loadAction = MTLLoadAction.Clear;
  colorAttachment.storeAction = MTLStoreAction.Store;
  colorAttachment.clearColor = transparentMetalColor();

  const commandBuffer = resources.commandQueue.commandBuffer();
  const encoder = commandBuffer.renderCommandEncoderWithDescriptor(descriptor);
  encoder.setRenderPipelineState(resources.pipeline);
  encoder.setFragmentBytesLengthAtIndex(resources.uniforms.mutableBytes, 16, 0);
  encoder.drawPrimitivesVertexStartVertexCount(MTLPrimitiveType.Triangle, 0, 3);
  encoder.endEncoding();
  commandBuffer.presentDrawable(drawable);
  commandBuffer.commit();
}

function transparentMetalColor() {
  const clearColor = new MTLClearColor();
  clearColor.red = 0;
  clearColor.green = 0;
  clearColor.blue = 0;
  clearColor.alpha = 0;
  return clearColor;
}

function describeNativeError(error: unknown) {
  if (error && typeof error === 'object') {
    const nativeError = error as Record<string, unknown>;
    if (typeof nativeError.localizedDescription === 'string') {
      return nativeError.localizedDescription;
    }
  }

  return 'Unknown Metal setup error.';
}

function nativeColor(red: number, green: number, blue: number, alpha: number) {
  return UIColor.colorWithRedGreenBlueAlpha(
    red / 255,
    green / 255,
    blue / 255,
    alpha,
  );
}

const METAL_SHINE_SHADER = `
#include <metal_stdlib>
using namespace metal;

struct VertexOut {
  float4 position [[position]];
  float2 uv;
};

struct Uniforms {
  float time;
  float aspect;
  float intensity;
  float seed;
};

vertex VertexOut pass_vertex(uint vertexID [[vertex_id]]) {
  const float2 positions[3] = {
    float2(-1.0, -1.0),
    float2( 3.0, -1.0),
    float2(-1.0,  3.0)
  };

  VertexOut out;
  out.position = float4(positions[vertexID], 0.0, 1.0);
  out.uv = positions[vertexID] * 0.5 + 0.5;
  return out;
}

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float softBand(float2 uv, float angle, float offset, float width) {
  float2 axis = normalize(float2(cos(angle), sin(angle)));
  float distanceToBand = dot(uv - 0.5, axis) - offset;
  return exp(-(distanceToBand * distanceToBand) / width);
}

fragment float4 pass_fragment(VertexOut in [[stage_in]],
                              constant Uniforms& uniforms [[buffer(0)]]) {
  float2 uv = in.uv;
  uv.x = (uv.x - 0.5) * uniforms.aspect + 0.5;

  float time = uniforms.time;
  float drift = sin(time * 0.72) * 0.055;
  float shimmer = sin((uv.x * 5.5 + uv.y * 7.0) + time * 1.35) * 0.5 + 0.5;

  float broad = softBand(uv, -0.78 + sin(time * 0.31) * 0.08, drift, 0.09);
  float broad2 = softBand(uv, -0.52 + cos(time * 0.27) * 0.05, drift - 0.18, 0.035);
  float hot = softBand(uv, -0.72 + cos(time * 0.23) * 0.05, drift + 0.035, 0.008);
  float hot2 = softBand(uv, -0.58, drift - 0.14, 0.012);
  float edge = softBand(uv, -0.92, drift - 0.11, 0.018);
  float edge2 = softBand(uv, -0.36, drift + 0.2, 0.028);
  float glow = exp(-length((uv - float2(0.5 + drift, 0.48)) * float2(1.4, 0.8)) * 2.8);
  float caustic = sin((uv.x * 9.0 - uv.y * 5.2) + time * 0.42) * 0.5 + 0.5;
  caustic *= sin((uv.x * 3.6 + uv.y * 10.0) - time * 0.31) * 0.5 + 0.5;

  float2 grainCell = floor((uv + time * 0.012) * float2(92.0, 140.0));
  float sparkle = smoothstep(0.95, 1.0, hash21(grainCell + uniforms.seed));
  sparkle *= smoothstep(0.04, 0.42, broad + broad2 + hot + hot2);

  float3 cool = float3(0.52, 0.78, 1.0);
  float3 white = float3(1.0, 0.98, 0.9);
  float3 warm = float3(1.0, 0.72, 0.28);
  float3 rose = float3(1.0, 0.38, 0.72);
  float3 teal = float3(0.28, 1.0, 0.88);
  float3 color = cool * broad * 0.58
    + teal * broad2 * 0.28
    + white * hot * (1.35 + shimmer * 0.36)
    + white * hot2 * 0.92
    + warm * edge * 0.58
    + rose * edge2 * 0.34
    + rose * pow(max(glow, 0.0), 2.2) * 0.18
    + warm * caustic * broad * 0.16
    + white * sparkle * 0.62;

  float alpha = saturate((broad * 0.42 + broad2 * 0.28 + hot * 0.92 + hot2 * 0.54 + edge * 0.34 + edge2 * 0.22 + glow * 0.12 + sparkle * 0.26) * uniforms.intensity);
  return float4(color, alpha);
}
`;
