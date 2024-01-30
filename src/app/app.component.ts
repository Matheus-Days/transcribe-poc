import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'transcribe';
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  audioWorkletNode: AudioWorkletNode | undefined;
  downloadRef: SafeResourceUrl | undefined;

  constructor(private sanitizer: DomSanitizer) {}

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.audioContext?.close();
    this.audioContext = undefined;
  }

  async start(): Promise<void> {
    this.audioContext = new AudioContext();

    this.stream = await this.getMediaStream();

    this.stream
      .getTracks()
      .forEach((track) => console.log(track.getSettings()));

    this.audioWorkletNode = await this.createAudioWorklet(this.audioContext);

    const streamNode = this.audioContext.createMediaStreamSource(this.stream);

    streamNode.connect(this.audioWorkletNode);

    this.audioWorkletNode.port.postMessage({ emissionInterval: 5 }); // Providing audio buffer interval value in seconds

    this.audioWorkletNode.port.onmessage = this.onAudioBufferAvailable;
  }

  private onAudioBufferAvailable = ({ data }: MessageEvent) => {
    const { audioBuffer } = data; // Use the emitted buffer as please
    console.log(audioBuffer); // I don't know yet if this data represents correctly the captured audio from the device, but all of this is to show the gist of using an AudioWorklet.
  };

  private async getMediaStream(): Promise<MediaStream> {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });
  }

  private async createAudioWorklet(
    audioContext: AudioContext
  ): Promise<AudioWorkletNode> {
    await audioContext.audioWorklet.addModule('/assets/transcribe.worklet.js');
    return new AudioWorkletNode(audioContext, 'transcribeWorklet');
  }
}
