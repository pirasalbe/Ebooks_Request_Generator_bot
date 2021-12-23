import { URL } from 'url';

export class AmazonReroute {
  private reroute: boolean;
  private url: URL | null;

  private constructor(reroute: boolean, url: URL | null) {
    this.reroute = reroute;
    this.url = url;
  }

  static reroute(url: URL): AmazonReroute {
    return new AmazonReroute(true, url);
  }

  static noReroute(): AmazonReroute {
    return new AmazonReroute(false, null);
  }

  shouldReroute(): boolean {
    return this.reroute;
  }

  getUrl(): URL {
    return this.url as URL;
  }
}
