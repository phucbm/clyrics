declare module 'segmentit' {
  class Segment {
    doSegment(text: string, options?: { simple?: boolean }): string[]
  }
  function useDefault(seg: Segment): Segment
  export { Segment, useDefault }
}
