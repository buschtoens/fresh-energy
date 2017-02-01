const request = require('request-promise-native');

const SERVER = 'https://www.getfresh.energy';

module.exports = class Api {
  constructor({ server = SERVER } = {}, ready) {
    this.server = server;

    this.options = {
      auth: {
        bearer: null
      },
      headers: {
        'User-Agent': `Node.js ${process.version} (${process.platform} ${process.arch})`,
        'X-Requested-By': 'private-client',
        'X-About': 'https://github.com/buschtoens/fresh-energy'
      },
      json: true
    };

    this.links = Object.create(null);
  }

  get token() {
    return this.options.auth.bearer;
  }

  set token(value) {
    this.options.auth.bearer = value;
  }

  get userId() {
    return this.profile.id;
  }

  async request(url, options) {
    const requestOptions = Object.assign(
      { method: 'GET', url },
      this.options,
      options
    );
    return await request(requestOptions);
  }

  async requestResource(resource, options) {
    return await this.request(`${this.server}/${resource}`, options);
  }

  async requestUserResource(resource, options) {
    const userId = this.profile.id;
    return await this.request(`${this.server}/users/${userId}/${resource}`, options);
  }

  async requestLink(name, options) {
    if (!(name in this.links)) {
      throw new Error(`Unknown link name '${name}'.`);
    }
    return this.request(this.links[name], options);
  }

  async login({ username, password, token }) {
    if (token) {
      this.token = token;
    } else if (username && password) {
      const { access_token } = await this.requestResource('oauth/token', {
        method: 'POST',
        auth: {
          user: 'fresh-webclient'
        },
        form: {
          username,
          password,
          grant_type: 'password'
        }
      });
      this.token = access_token;
    } else {
      throw new Error('No token or username and password combination supplied.');
    }
  }

  async fetchLinks() {
    const { _links: links } = await this.requestResource('links');
    Object.entries(links).forEach(([key, { href }]) => {
      this.links[key] = href;
    });
  }

  async initialize() {
    await this.fetchLinks();
    this.profile = await this.requestLink('profile');
  }

  async loadReadings(date) {
    const {
      readings,
      _links: {
        next: { href: nextUrl = null } = {}
      }
    } = await this.requestUserResource(`readings/${Api.serializeDate(date)}`);

    return { readings, next: nextUrl && Api.extractDateFromURL(nextUrl) };
  }

  static serializeDate(date) {
    return date.toISOString()
      .replace('T', '_')
      .replace(/:/g, '-')
      .replace(/\.\d{3}Z.*$/, '');
  }

  static extractDateFromURL(url) {
    const [, ...utcArguments] = url.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    const ints = utcArguments.map((x) => Number.parseInt(x, 10));
    ints[1]--;
    return new Date(Date.UTC(...ints));
  }
};
