/**
 * AudioWorklet processor for capturing PCM audio at 16kHz.
 * Replaces deprecated ScriptProcessorNode.
 * Sends Float32 audio to main thread for conversion and WebSocket streaming.
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      if (channelData && channelData.length > 0) {
        this.port.postMessage({
          audio: channelData.slice(),
        });
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
