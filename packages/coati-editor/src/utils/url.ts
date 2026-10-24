/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:']);

export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // eslint-disable-next-line no-script-url
    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return 'about:blank';
    }
  } catch {
    return url;
  }
  return url;
}

export function validateUrl(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where the user can type the URL before inserting it.
  if (url === 'https://') {
    return true;
  }

  try {
    const lowerUrl = url.toLowerCase();
    const hasSupportedProtocol = Array.from(SUPPORTED_URL_PROTOCOLS).some((protocol) => lowerUrl.startsWith(protocol));
    const parsedUrl = new URL(hasSupportedProtocol ? url : `https://${url}`);
    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return false;
    }

    return parsedUrl.protocol === 'mailto:' || parsedUrl.protocol === 'sms:' || parsedUrl.protocol === 'tel:'
      ? parsedUrl.pathname.length > 0
      : parsedUrl.hostname.length > 0;
  } catch {
    return false;
  }
}
