/**
 * Network Utilities
 *
 * Detects local IP address for LAN access display.
 * @module utils/networkUtils
 */

'use strict';

const os = require('os');

/**
 * Gets the local IPv4 address for LAN access.
 * @returns {string} The local IP address
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

module.exports = { getLocalIP };
