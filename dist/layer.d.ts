import { default as mapboxgl, CustomLayerInterface } from 'mapbox-gl';

type MapboxInterpolateHeatmapLayerOptions = {
    id: string;
    data: {
        lat: number;
        lon: number;
        val: number;
    }[];
    framebufferFactor?: number;
    maxValue?: number;
    minValue?: number;
    opacity?: number;
    p?: number;
    aoi?: {
        lat: number;
        lon: number;
    }[];
    valueToColor?: string;
    valueToColor4?: string;
    textureCoverSameAreaAsROI?: boolean;
};
declare class MapboxInterpolateHeatmapLayer implements CustomLayerInterface {
    id: string;
    data: {
        lat: number;
        lon: number;
        val: number;
    }[];
    framebufferFactor: number;
    maxValue: number;
    minValue: number;
    opacity: number;
    p: number;
    aoi?: {
        lat: number;
        lon: number;
    }[];
    valueToColor?: string;
    valueToColor4?: string;
    textureCoverSameAreaAsROI: boolean;
    points: number[][];
    aPositionComputation?: number;
    aPositionDraw?: number;
    canvas?: HTMLCanvasElement;
    computationFramebuffer: WebGLFramebuffer | null;
    computationProgram: WebGLProgram | null;
    computationTexture: WebGLTexture | null;
    computationVerticesBuffer: WebGLBuffer | null;
    drawingVerticesBuffer: WebGLBuffer | null;
    drawProgram: WebGLProgram | null;
    framebufferHeight?: number;
    framebufferWidth?: number;
    indicesBuffer: WebGLBuffer | null;
    indicesNumber: number | null;
    renderingMode: '2d' | '3d';
    resizeFramebuffer?: () => void;
    type: 'custom';
    uComputationTexture: WebGLUniformLocation | null;
    uFramebufferSize: WebGLUniformLocation | null;
    uMatrixComputation: WebGLUniformLocation | null;
    uMatrixDraw: WebGLUniformLocation | null;
    uOpacity: WebGLUniformLocation | null;
    uP: WebGLUniformLocation | null;
    uScreenSizeDraw: WebGLUniformLocation | null;
    uUi: WebGLUniformLocation | null;
    uXi: WebGLUniformLocation | null;
    constructor(options: MapboxInterpolateHeatmapLayerOptions);
    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    onRemove(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    prerender(gl: WebGLRenderingContext, matrix: number[]): void;
    render(gl: WebGLRenderingContext, matrix: number[]): void;
}
export { MapboxInterpolateHeatmapLayer };
