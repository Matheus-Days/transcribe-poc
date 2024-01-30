class TranscribeWorklet extends AudioWorkletProcessor {
  /**
   * @var {Float32Array[]}
   */
  audioBuffer = [];
  emissionInterval = 0.0;
  lastEmission = 0.0;

  constructor() {
    super();

    // Receiving relevant 'params' from main thread not available on scope by default
    this.port.onmessage = ({ data }) => {
      this.emissionInterval = data.emissionInterval || 0;
    }
  }

  maybeEmitBuffer() {
    if (this.emissionInterval === 0) return;

    if ((currentTime - this.lastEmission) >= this.emissionInterval) {
      this.port.postMessage({ audioBuffer: this.audioBuffer });
      this.lastEmission = currentTime;
      this.audioBuffer = [];
    }
  }

  /**
   * @param {Float32Array[][]} inputs An array of inputs connected to the node, each item of which is, in turn, an array of channels. Each channel is a Float32Array containing 128 samples. For example, inputs[n][m][i] will access n-th input, m-th channel of that input, and i-th sample of that channel.
   */
  process(inputs) {
    this.audioBuffer.push(inputs[0][0]) // Currently taking samples only from first channel of first device device. Tweak as needed.
    this.maybeEmitBuffer();

    return true;
  }
}

registerProcessor("transcribeWorklet", TranscribeWorklet);
