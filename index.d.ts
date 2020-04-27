// Generated file; run `make types` to update.
declare interface OutlineNode extends Array<OutlineNode> {name: string; level: number; parent?: OutlineNode}
declare interface Point extends Array<number> {x: number; y: number}
declare type Bitmap = number | bigint | (number|bigint)[];
declare type CMYColour = [number, number, number];
declare type CMYKColour = [number, number, number, number];
declare type CommandList = Array<(string|Array<string>)>;
declare type DrawTextResult = {x: number; y: number; remainder: string[]};
declare type ExecOptions = string | {cwd?: string; encoding?: string[] | string; env?: object; outputPath?: string};
declare type ExecResult = {code?: number; stdout?: string; stderr?: string};
declare type FontStyle = {fontFamily: string; fontSize: string; fontVariant: string; fontWeight: string; lineHeight: string};
declare type HSLColour = [number, number, number];
declare type HSVColour = [number, number, number];
declare type NewlineEscapeStrategy = "collapse" | "error" | "escape" | "ignore" | "quote" | "strip";
declare type NullByteEscapeStrategy = "error" | "escape" | "ignore" | "strip";
declare type ParsedPrimitive = {type?: Function; value: any; name?: string; delimiter?: string};
declare type ParsedURL = {protocol?: string; auth?: string; username?: string; password?: string; hostname?: string; port?: number; pathname?: string; filename?: string; query?: string; fragment?: string};
declare type RGBColour = [number, number, number];
declare type ShellEscapeOptions = {isPath?: boolean; newlines?: NewlineEscapeStrategy; nullBytes?: NullByteEscapeStrategy; quoted?: boolean};
declare type WSFrame = {isFinal: boolean; isRSV1: boolean; isRSV2: boolean; isRSV3: boolean; length: bigint; mask?: number; opcode: number; opname: string; payload: number[]; trailer: number[]};
export declare const BlendModes:{[key: string]: (...args: number[]) => number};
export declare function New(type: string, attr?: object): Element;
export declare function addTo(parent: Node): Function;
export declare function adler32(bytes: number[]): number;
export declare function alignText(input: string, width: number, axis?: number, char?: string): string;
export declare function angleTo(a: Point, b: Point): number;
export declare function base64Decode(data: string): number[];
export declare function base64Encode(bytes: number[]): string;
export declare function bindMethods(subject: object): object;
export declare function bitmapToRGBA(bitmap: Bitmap, width?: number, height?: number, colour?: number): Uint8ClampedArray;
export declare function buildDict(dl: HTMLDListElement, valueKey?: boolean, filter?: Function | RegExp): object;
export declare function byteCount(value: number, byteSize?: number): number;
export declare function bytesToFloat32(bytes: number[], littleEndian?: boolean): Float32Array;
export declare function bytesToFloat64(bytes: number[], littleEndian?: boolean): Float64Array;
export declare function bytesToInt16(bytes: number[], littleEndian?: boolean): Int16Array;
export declare function bytesToInt32(bytes: number[], littleEndian?: boolean): Int32Array;
export declare function bytesToInt64(bytes: number[], littleEndian?: boolean): BigInt64Array;
export declare function bytesToInt8(bytes: number[]): Int8Array;
export declare function bytesToUint16(bytes: number[], littleEndian?: boolean): Uint16Array;
export declare function bytesToUint32(bytes: number[], littleEndian?: boolean): Uint32Array;
export declare function bytesToUint64(bytes: number[], littleEndian?: boolean): BigUint64Array;
export declare function camelToKebabCase(input: string): string;
export declare function clamp(input: number, min?: number, max?: number): number;
export declare function cmyToCMYK(input: CMYColour): CMYKColour;
export declare function cmyToRGB(input: CMYColour): RGBColour;
export declare function cmykToCMY(input: CMYKColour): CMYColour;
export declare function cmykToRGB(input: CMYKColour): RGBColour;
export declare function collectStrings(input: any[] | string, refs?: WeakSet<object>): string[];
export declare function collectTextNodes(el: Element, filter?: string): CharacterData[];
export declare function cookie(name: string, value?: string, attr?: {expires?: string; path?: string; domain?: string; secure?: boolean}): string;
export declare function crc32(data: number[]): number;
export declare function deCasteljau(points: Point[], position?: number): Point[];
export declare function debounce(fn: Function, limit?: number, asap?: boolean): Function;
export declare function deepest(el: Element): Node;
export declare function degToRad(value: number): number;
export declare function deindent(input: object | string, ...args: string[]): string;
export declare function distance(a: Point, b: Point): number;
export declare function drawHTML(context: CanvasRenderingContext2D, node: Node, x?: number, y?: number, w?: number, h?: number): Promise<HTMLImageElement>;
export declare function drawPolygon(context: CanvasRenderingContext2D, points: Point[], fill?: boolean): void;
export declare function drawTextArea(context: CanvasRenderingContext2D, text: string | any[], x?: number, y?: number, w?: number, h?: number, leading?: number, indent?: number): DrawTextResult;
export declare function escapeCtrl(input: string, opts?: {before?: string; after?: string; include?: string; exclude?: string; caret?: boolean; named?: boolean; octal?: boolean; pictures?: boolean}): string;
export declare function escapeHTML(input: string): string;
export declare function escapeRegExp(input: string): string;
export declare function escapeShellArg(input: string, options?: ShellEscapeOptions): string;
export declare function exec(command: string, argList: string[], input?: string, options?: ExecOptions): Promise<ExecResult>;
export declare function execChain(commands: CommandList, input?: string, options?: ExecOptions): Promise<ExecResult>;
export declare function execString(input: string): Promise<string>;
export declare function expandEscapes(input: string, all?: boolean, ignoreUnknown?: boolean): string;
export declare function extractTableData(table: HTMLTableElement): object[];
export declare function findBasePath(paths: string[]): string;
export declare function formatBytes(bytes: number): string;
export declare function formatTime(input: number): string;
export declare function getCanvasFont(context: CanvasRenderingContext2D): FontStyle;
export declare function getProperties(subject: object): Map<(string|symbol), PropertyDescriptor>;
export declare function getScrollbarWidth(): number;
export declare function getUnusedChar(input: string, count?: number): string;
export declare function getWebGLSupport(): string;
export declare function hex(...args: any[]): string;
export declare function hexToRGB(input: string | number): RGBColour;
export declare function hslToHSV(input: HSLColour): HSVColour;
export declare function hslToRGB(input: HSLColour): RGBColour;
export declare function hsvToHSL(input: HSVColour): HSLColour;
export declare function hsvToRGB(input: HSVColour): RGBColour;
export declare function injectWordBreaks(element: Element, limit?: number): HTMLElement[];
export declare function int16ToBytes(input: number | number[], littleEndian?: boolean): Uint8Array;
export declare function int32ToBytes(input: number | number[], littleEndian?: boolean): Uint8Array;
export declare function int64ToBytes(input: bigint | bigint[], littleEndian?: boolean): Uint8Array;
export declare function int8ToBytes(input: number | number[]): Uint8Array;
export declare function isBrowser(): boolean;
export declare function isByteArray(input: any): boolean;
export declare function isFixedWidth(font: string): boolean;
export declare function isIE(version: string, operand: string): boolean;
export declare function isLittleEndian(): boolean;
export declare function isPrimitive(input: any): boolean;
export declare function isString(input: any): boolean;
export declare function isTypedArray(input: any): boolean;
export declare function isValidCCNumber(input: string): boolean;
export declare function isplit(input: string, pattern?: RegExp | string): string[];
export declare function kebabToCamelCase(input: string): string;
export declare function keyGrep(subject: object, pattern: RegExp | string): object;
export declare function ls(paths?: string[], options?: {filter?: RegExp | Function; ignore?: RegExp | Function; recurse?: number; followSymlinks?: boolean}): Promise<Map<string, fs.Stats>>;
export declare function nearest(subject: Node, selector: string, ignoreSelf?: boolean): Element;
export declare function nerf(fn: Function, context?: object): Function;
export declare function normalise(value: number): number[];
export declare function ordinalSuffix(n: number): string;
export declare function parseCSSDuration(value: string): number;
export declare function parseHTMLFragment(input: string): Node[];
export declare function parseKeywords(keywords: string | string[]): {[key: string]: boolean};
export declare function parsePrimitive(input: string, useDoubleAt?: boolean): ParsedPrimitive;
export declare function parseTime(input: string): number;
export declare function parseURL(path: string): ParsedURL;
export declare function partition(input: string | Iterable, sizes?: number | number[]): (string|Array)[];
export declare function poll(fn: Function, opts?: {rate?: number; timeout?: number; negate?: boolean}): Promise<void>;
export declare function punch(subject: object, methodName: string, handler: Function): Array<Function>;
export declare function radToDeg(value: number): number;
export declare function random(min?: number, max: number): number;
export declare function readStdin(encoding?: string): Promise<string>;
export declare function resolveProperty(path: string, object: object, usePrevious?: boolean): any;
export declare function rgbToCMY(input: RGBColour): CMYColour;
export declare function rgbToCMYK(input: RGBColour): CMYKColour;
export declare function rgbToHSL(input: RGBColour): HSLColour;
export declare function rgbToHSV(input: RGBColour): HSVColour;
export declare function rgbToHex(input: RGBColour, asString?: boolean): string | number;
export declare function rgba(r: number, g: number, b: number, a: number): number[];
export declare function rmrf(paths: string | string[], ignoreErrors?: boolean): Promise<void>;
export declare function rotl(value: number, count: number): number;
export declare function rotr(value: number, count: number): number;
export declare function roundTiesToAway(input: number): number;
export declare function roundTiesToEven(input: number): number;
export declare function roundTowardNegative(input: number): number;
export declare function roundTowardPositive(input: number): number;
export declare function sha1(input: number[]): string;
export declare function sip(file: string, length?: number, offset?: number, raw?: boolean): Promise<(string|Uint8Array)>;
export declare function slug(name: string): string;
export declare function sortn(a: string, b: string): number;
export declare function splitOptions(argv: Array<Array<string>>, niladicShort?: string, monadicShort?: string, monadicLong?: string): string[];
export declare function splitStrings(input: string, options?: {delimiters?: string; quoteChars?: string; escapeChars?: string; keepQuotes?: boolean; keepEscapes?: boolean}): string[];
export declare function sum(...values: number[] | bigint[]): number;
export declare function supportsCSSProperty(name: string): boolean;
export declare function supportsCSSSelector(selector: string): boolean;
export declare function supportsCSSUnit(name: string): boolean;
export declare function tildify(input: string): string;
export declare function timeSince(time: number | Date, maxYear?: boolean): string;
export declare function titleCase(input: string): string;
export declare function tokeniseOutline(input: string): OutlineNode[];
export declare function tween(subject: object, propertyName: string, endValue: number, options?: {curve?: Point[]; callback?: Function; filter?: Function; duration?: number; fps?: number}): Promise<any>;
export declare function uint(value: any): number;
export declare function uint16ToBytes(input: number | number[], littleEndian?: boolean): Uint8Array;
export declare function uint32ToBytes(input: number | number[], littleEndian?: boolean): Uint8Array;
export declare function uint64ToBytes(input: bigint | bigint[], littleEndian?: boolean): Uint8Array;
export declare function utf16Decode(input: string | number[], littleEndian?: boolean, addBOM?: boolean): number[];
export declare function utf16Encode(bytes: number[], opts?: {allowUnpaired?: boolean; codePoints?: boolean; endianness?: string}): string | number[];
export declare function utf32Decode(input: string | number[], littleEndian?: boolean, addBOM?: boolean): number[];
export declare function utf32Encode(bytes: number[], opts?: {codePoints?: boolean; endianness?: string}): string | number[];
export declare function utf8Decode(input: string | number[]): number[];
export declare function utf8Encode(bytes: number[], opts?: {allowOverlong?: boolean; allowSurrogates?: boolean; codePoints?: boolean; strict?: boolean; stripBOM?: boolean}): string | number[];
export declare function vlqDecode(input: string): number[];
export declare function vlqEncode(input: number): string;
export declare function wait(delay?: number): Promise<void>;
export declare function which(name: string, all?: boolean): Promise<(string|Array<string>)>;
export declare function wordCount(input: string, ignoreHyphens?: boolean): number;
export declare function wordWrap(input: string, length?: number): string[];
export declare function wsDecodeFrame(input: number[], noMask?: boolean): WSFrame;
export declare function wsEncodeFrame(input: WSFrame, noMask?: boolean): Uint8Array;
export declare function wsHandshake(key: string): string;
