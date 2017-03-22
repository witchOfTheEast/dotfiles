var Buffer,
    PORTS,
    SKIP_IPS,
    BIND_PORT,
    SOCKET_ID,
    V2_SOCKET_ID,
    CK_SOCKET_ID,
    IS_WINDOWS,
    MCAST_ADDR = '233.89.188.1',
    MCAST_PORT = 10001;

V2_SOCKET_ID = -1;
CK_SOCKET_ID = [];
PORTS = [];
SKIP_IPS = [];

IS_WINDOWS = navigator.platform.toLowerCase() === 'win32' || navigator.platform.toLowerCase() === 'win64';
BIND_PORT = 0;

var knownDevices = {};

// Primitive node-style Buffer impl....
function Buffer (content) {

    var i,
        l,
        arr,
        view;

    if (!(content instanceof ArrayBuffer)) {

        if (typeof content === 'number') {
            content = new ArrayBuffer(content);
        }

        else if (content.length) {
            l = content.length;
            arr = content;
            content = new ArrayBuffer(l);
            view = new Uint8Array(content);

            for (i = 0; i < l; i ++) {
                view[i] = arr[i];
            }
        }

        else {
            throw new Error('Unsupported Buffer content.');
        }
    }

    this.arrayBuffer = content;
    this.view = new Uint8Array(content);

    this.length = content.byteLength;

    return this;
};

Buffer.prototype.get = function (i) {
    if (!this.view) {return 0;}
    return this.view[i];
};

Buffer.prototype.set = function (i, val) {
    this.view[i] = val;
};

Buffer.prototype.getArrayBuffer = function () {
    return this.arrayBuffer;
};

Buffer.prototype.readUInt8 = function (i) {
    return this.get(i);
};

Buffer.prototype.readUInt16BE = function (i) {
    return (this.get(i) << 8) | this.get(i + 1);
};

Buffer.prototype.readUInt32BE = function (i) {

  return ((this.get(i)) |
      (this.get(i + 1) << 8) |
      (this.get(i + 2) << 16)) +
      (this.get(i + 3) * 0x1000000);
};

Buffer.prototype.slice = function (start, end) {
    return new Buffer(this.arrayBuffer.slice(start, end));
};

Buffer.prototype.toString = function () {
    return String.fromCharCode.apply(null, this.view);
};


function formatMacAddress (buffer) {

    var i,
        tmp,
        mac;

    mac = '';

    for (i = 0; i < buffer.length; i ++) {

        tmp = buffer.get(i).toString(16);

        if (tmp.length < 2) {
            tmp = '0' + tmp;
        }

        mac += tmp;
    }

    return mac.toUpperCase();
}

function formatIPAddress (buffer) {

    var i,
        a;

    a = [];

    for (i = 0; i < buffer.length; i ++) {
        a.push(buffer.get(i));
    }

    return a.join('.');
}

function getIntValue(array) {
    var val = 0;
    val += array.readUInt8(0);
    val = val << 8;
    val += array.readUInt8(1);
    val = val << 8;
    val += array.readUInt8(2);
    val = val << 8;
    val += array.readUInt8(3);
    return val;
}

function parsePacket (info, packet) {
    packet = new Buffer(packet);

    var version = packet.slice(0, 1).readUInt8(0);
    var cmd = packet.slice(1, 2).readUInt8(0);
    var length = packet.slice(2, 4).readUInt16BE(0);

    if (length + 4 > packet.length) {
        //console.log('Packet reports invalid data length, discarding...');
        return;
    }

    if (version == 1 && cmd == 0 && length == 0) {
        // ignore ubnt-dp request
        return;
    }

    if (version == 1 && cmd == 0) {
        return parseV1Packet(packet);
    } else if (version == 2) {
        return parseV2Packet(info, cmd, packet);
    } else {
        // not supported
    }
}

function parseV1Packet (packet) {

    var PKT_V1_HWADDR = 0x01,
        PKT_V1_IPINFO = 0x02,
        PKT_V1_FWVERSION = 0x03,
        PKT_V1_USERNAME = 0x06,
        PKT_V1_SALT = 0x07,
        PKT_V1_RND_CHALLENGE = 0x08,
        PKT_V1_CHALLENGE = 0x09,
        PKT_V1_MODEL = 0x14,
        PKT_V1_UPTIME = 0x0A,
        PKT_V1_HOSTNAME = 0x0B,
        PKT_V1_PLATFORM = 0x0C,
        PKT_V1_ESSID = 0x0D,
        PKT_V1_WMODE = 0x0E,
        PKT_V1_WEBUI = 0x0F;

    var i,
        l,
        end,
        msg,
        type,
        piece;

    i = 4;
    l = 2;

    msg = {};
    msg.discovered_by = 1;

    end = packet.length;

    while (i < end) {

        type = packet.readUInt8(i++);
        piece = packet.slice(i, i + 2);
        l = piece.readUInt16BE(0);
        i += piece.length;

        piece = packet.slice(i, i + l);

        switch (type) {

            case PKT_V1_FWVERSION:
                msg.firmware = piece.toString();
                break;

            case PKT_V1_HOSTNAME:
                msg.hostname = piece.toString();
                break;

            case PKT_V1_PLATFORM:
                msg.platform = piece.toString();
                break;

            case PKT_V1_IPINFO:

                if (piece.length === 10) {
                    msg.mac = msg.mac || formatMacAddress(piece.slice(0, 6));
                    msg.ip = msg.ip || formatIPAddress(piece.slice(6, 10));
                }

               break;

            case PKT_V1_HWADDR:
                msg.mac = formatMacAddress(piece);
                break;

            case PKT_V1_WEBUI:

                if (piece.length === 4) {
                    piece = getIntValue(piece);
                    msg.webPort = piece & 0xFFFF;
                    msg.webProtocol = ((piece >> 16) & 0xFFFF) > 0 ? 'https' : 'http';
                }

                break;

            case PKT_V1_WMODE:

                if (piece.length === 4) {
                    msg.wmode = getIntValue(piece);

                    // this is unifi-video specific
                    // 0x101 || 0x102 means it has already gone through wizard
                    msg.isSetup = true;
                    if (msg.wmode === 0x100) {
                        msg.isSetup = false;
                    }
                }

                break;

            case PKT_V1_ESSID:
                msg.essid = piece.toString();
                break;

            case PKT_V1_MODEL:
                msg.model = piece.toString();
                break;

            default:
                break;

        }

        i += l;
    }

    return msg;
}

function parseV2Packet (info, cmd, packet) {

    var PKT_V2_HWADDR = 0x01,
        PKT_V2_IPINFO = 0x02,
        PKT_V2_FWVERSION = 0x03,
        PKT_V2_UPTIME = 0x0A,
        PKT_V2_HOSTNAME = 0x0B,
        PKT_V2_PLATFORM = 0x0C,
        PKT_V2_ESSID = 0x0D,
        PKT_V2_WMODE = 0x0E,
        PKT_V2_SEQ = 0x12,
        PKT_V2_SOURCE_MAC = 0x13,
        PKT_V2_MODEL = 0x15,
        PKT_V2_SHORT_VER = 0x16,
        PKT_V2_DEFAULT = 0x17,
        PKT_V2_LOCATING = 0x18,
        PKT_V2_DHCPC = 0x19,
        PKT_V2_DHCPC_BOUND = 0x1A,
        PKT_V2_REQ_FW = 0x1B,
        PKT_V2_SSHD_PORT = 0x1C;

    var i,
        l,
        end,
        msg,
        type,
        piece;

    i = 4;
    l = 2;

    msg = {};
    msg.discovered_by = 2;

    end = packet.length;

    if (cmd != 6 && cmd != 9 && cmd != 11)
        return;

    while (i < end) {

        type = packet.readUInt8(i++);
        piece = packet.slice(i, i + 2);
        l = piece.readUInt16BE(0);
        i += piece.length;

        piece = packet.slice(i, i + l);

        switch (type) {

            case PKT_V2_HWADDR:
                msg.mac = formatMacAddress(piece);
                break;

            case PKT_V2_IPINFO:

                if (piece.length === 10) {
                    msg.mac = msg.mac || formatMacAddress(piece.slice(0, 6));
                    msg.ip = msg.ip || formatIPAddress(piece.slice(6, 10));
                }

               break;

            case PKT_V2_FWVERSION:
                msg.firmware = piece.toString();
                break;

            case PKT_V2_UPTIME:
                msg.uptime = getIntValue(piece);
                break;

            case PKT_V2_HOSTNAME:
                msg.hostname = piece.toString();
                break;

            case PKT_V2_PLATFORM:
                msg.platform = piece.toString();
                break;

            case PKT_V2_ESSID:
                msg.essid = piece.toString();
                break;

            case PKT_V2_WMODE:

                if (piece.length === 4) {
                    msg.wmode = getIntValue(piece);
                }

                break;

            case PKT_V2_SEQ:
                msg.seq = getIntValue(piece);
                break;

            case PKT_V2_SOURCE_MAC:
                msg.src_mac = formatMacAddress(piece);
                break;

            case PKT_V2_MODEL:
                msg.model = piece.toString();
                break;

            case PKT_V2_SHORT_VER:
                msg.short_ver = piece.toString();
                break;

            case PKT_V2_DEFAULT:
                msg.is_default = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_LOCATING:
                msg.is_locating = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_DHCPC:
                msg.is_dhcpc = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_DHCPC_BOUND:
                msg.is_dhcpc_bound = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_REQ_FW:
                msg.req_fwversion = piece.toString();
                break;

            case PKT_V2_SSHD_PORT:
                msg.sshd_port = getIntValue(piece);
                break;

            default:
                break;

        }

        i += l;
    }

    if (cmd === 6) {
        msg.timestamp = Math.round(+new Date()/1000);
    }
    if (cmd == 11 && !msg.hasOwnProperty('sshd_port')) {
        // invoke sshd on UVP
        sendV2InvokeSshd(info);
        return;
    }
    msg.firmware = msg.firmware || msg.short_ver || '';
    msg.hostname = msg.hostname || '';
    return msg;
}

function sendV2InvokeSshd(info) {
    var message = new Buffer([0x02, 0x0a, 0x00, 0x00]).arrayBuffer;
    chrome.sockets.udp.send(V2_SOCKET_ID, message, info.remoteAddress, info.remotePort, function (result) { });
}

function scanForV2Devices() {
    var message = new Buffer([0x02, 0x08, 0x00, 0x00]).arrayBuffer;

    for (i = 0; i < CK_SOCKET_ID.length; i++) {
        var socket_id = CK_SOCKET_ID[i];

        chrome.sockets.udp.send(socket_id, message, MCAST_ADDR, MCAST_PORT, function (result) {
            if (chrome.runtime.lastError) {
            }
        });
    }

    if (!SOCKET_ID) {
        return;
    }

    function scanSubnet (subnet) {

        var i;

        function doSend (ip) {

            if (SKIP_IPS.indexOf(ip) > -1) {
                //return;
            }

            chrome.sockets.udp.send(SOCKET_ID, message, ip, MCAST_PORT, function (result) {

                if (chrome.runtime.lastError) {
                    if (result.resultCode === -109) {
                        SKIP_IPS.push(ip);

                    }
                }
            });
        }

        if (IS_WINDOWS) {
            doSend(subnet.netbcastDotQuad);
        }

        else {
            for (i = subnet.netaddressInteger + 1; i < subnet.netbcastInteger; i ++ ) {
                doSend(IPv4_intA_to_dotquadA(i));
            }
        }
    }

    chrome.system.network.getNetworkInterfaces(function (interfaces) {

        var i,
            tmp,
            intf,
            subnets;

        subnets = [];

        for (i = 0; i < interfaces.length; i ++ ) {

            intf = interfaces[i];

            if (
                intf.address.split('.').length !== 4
                || intf.prefixLength <= 20
            ) {
                continue;
            }

            subnets.push(new IPv4_Address(intf.address, intf.prefixLength));
        }

        for (i = 0; i < subnets.length; i ++) {
            scanSubnet(subnets[i]);
        }
    });
}

function scanForDevices () {

    var message;

    message = new Buffer([0x01, 0x00, 0x00, 0x00]).arrayBuffer;

    if (!SOCKET_ID) {
        return;
    }

    chrome.sockets.udp.send(SOCKET_ID, message, MCAST_ADDR, MCAST_PORT, function (result) {
        if (chrome.runtime.lastError) {
        }
    });

    function scanSubnet (subnet) {

        var i;

        function doSend (ip) {

            if (SKIP_IPS.indexOf(ip) > -1) {
                //return;
            }

            chrome.sockets.udp.send(SOCKET_ID, message, ip, MCAST_PORT, function (result) {

                if (chrome.runtime.lastError) {
                    if (result.resultCode === -109) {
                        SKIP_IPS.push(ip);

                    }
                }
            });
        }

        if (IS_WINDOWS) {
            doSend(subnet.netbcastDotQuad);
        }

        else {
            for (i = subnet.netaddressInteger + 1; i < subnet.netbcastInteger; i ++ ) {
                doSend(IPv4_intA_to_dotquadA(i));
            }
        }
    }

    chrome.system.network.getNetworkInterfaces(function (interfaces) {

        var i,
            tmp,
            intf,
            subnets;

        subnets = [];

        for (i = 0; i < interfaces.length; i ++ ) {

            intf = interfaces[i];

            if (
                intf.address.split('.').length !== 4
                || intf.prefixLength <= 20
            ) {
                continue;
            }

            subnets.push(new IPv4_Address(intf.address, intf.prefixLength));
        }

        for (i = 0; i < subnets.length; i ++) {
            scanSubnet(subnets[i]);
        }
    });

    var m = {
        action : 'SCAN_COMPLETED'
    };

    for (i = 0; i < PORTS.length; i ++) {
        PORTS[i].postMessage(m);
    }
};

function isIpInSubnet(ip, host, netmask) {
    var host_subnet = new IPv4_Address(host, netmask),
        ip_val = IPv4_dotquadA_to_intA(ip);
    return ip_val >= host_subnet.netaddressInteger && ip_val <= host_subnet.netbcastInteger;
}

function deviceFound (device) {
    knownDevices[device.ip] = device;
    var i,
        m;

    device.model = device.discovered_by === 1 ? device.platform : device.model;
    if (device.model) {
        device.subtype = device.model.replace(/([^-]+)-?(.*)/, '$2');
        device.model = device.model.replace(/([^-]+)-?(.*)/, '$1');
    }
    if (device.discovered_by === 2 && !mfi_bundles[device.model]) {
        device.family = 'UniFi';
    } else if (device.discovered_by === 1 && unifi_bundles[device.model]) {
        device.family = 'UniFi';
    } else {
        device.family = 'AirOS';
    }

    if (unifi_bundles[device.model]) {
        device.display = unifi_bundles[device.model].display + (device.subtype.length == 0 ? '' : ' ' + device.subtype);
        device.is_cloudkey = !!unifi_bundles[device.model].is_cloudkey;
    } else if (mfi_bundles[device.model]) {
        device.display = mfi_bundles[device.model].display;
    } else {
        device.display = device.model;
    }
    m = {
        action : 'DEVICE_DISCOVERED',
        device : device
    };

    for (i = 0; i < PORTS.length; i ++) {
        PORTS[i].postMessage(m);
    }
};

// Create V1 Socket
chrome.sockets.udp.create({}, function(socketInfo) {

    var device;

    SOCKET_ID = socketInfo.socketId;

    chrome.sockets.udp.setMulticastTimeToLive(SOCKET_ID, 100, function (result) {

    });

    chrome.sockets.udp.onReceiveError.addListener(function (info) {

        if (info.socketId !== SOCKET_ID) {
            return;
        }

    });

    chrome.sockets.udp.onReceive.addListener(function (info) {

        if (info.socketId !== SOCKET_ID) {
            return;
        }

        device = parsePacket(info, info.data);

        if (device) {
            deviceFound(device);
        }
    });



    chrome.sockets.udp.bind(SOCKET_ID, '0.0.0.0', BIND_PORT, function (result) {

        if (result < 0) {
            console.log('Error binding v1 socket.');
            return;
        }

        chrome.sockets.udp.joinGroup(SOCKET_ID, MCAST_ADDR, function (result) {

        });

    });
});

function createV2Socket() {
    function bindV2Socket() {
        chrome.sockets.udp.bind(V2_SOCKET_ID, '0.0.0.0', MCAST_PORT, function (result) {
            if (chrome.runtime.lastError || result < 0) {
                //console.log('Error %s binding v2 socket.  Retry in 10 seconds.', chrome.runtime.lastError ? chrome.runtime.lastError.message : '');
                var m = {
                    action : 'BINDING_V2_PORT_FAILED'
                };

                for (i = 0; i < PORTS.length; i ++) {
                    PORTS[i].postMessage(m);
                }

                setTimeout(bindV2Socket, 10000);
                V2_SOCKET_ID = -1;
                return;
            }
        });
    }

    if (V2_SOCKET_ID >= 0) {
        return;
    }

    chrome.sockets.udp.create({}, function(socketInfo) {

        var device;

        V2_SOCKET_ID = socketInfo.socketId;

        chrome.sockets.udp.onReceiveError.addListener(function (info) {

            if (info.socketId !== V2_SOCKET_ID) {
                return;
            }

        });

        chrome.sockets.udp.onReceive.addListener(function (info) {

            if (info.socketId !== V2_SOCKET_ID) {
                return;
            }

            device = parsePacket(info, info.data);

            if (device) {
                deviceFound(device);
            }
        });

        bindV2Socket();
    });
}

function closeV2Socket() {
    if (V2_SOCKET_ID >= 0) {
        chrome.sockets.udp.close(V2_SOCKET_ID);
        V2_SOCKET_ID = -1;
    }
}


function createCKSocket(intf_ipaddr) {
    chrome.sockets.udp.create({}, function(socketInfo) {
        var device;

        var socket_id = socketInfo.socketId;

        chrome.sockets.udp.setMulticastLoopbackMode(socket_id, true, function(result) {
            chrome.sockets.udp.bind(socket_id, intf_ipaddr, 0, function (result) {
                if (chrome.runtime.lastError || result < 0) {
                    chrome.sockets.udp.close(socket_id);

                    return;
                }

                chrome.sockets.udp.joinGroup(socket_id, MCAST_ADDR, function (result) {
                    if (chrome.runtime.lastError || result < 0) {
                        chrome.sockets.udp.close(socket_id);
                        return;
                    }

                    CK_SOCKET_ID.push(socket_id);

                    return;
                });
            });
        });
    });
}


function create_multi_sockets() {
    function ck_onReceiveError(info) {
        var i = CK_SOCKET_ID.indexOf(info.socketId);
        if (i == -1)
            return;
    }


    function ck_onReceive(info) {
        var i = CK_SOCKET_ID.indexOf(info.socketId);
        if (i == -1)
            return;

        device = parsePacket(info, info.data);

        if (device) {
            deviceFound(device);
        }
    }

    chrome.sockets.udp.onReceiveError.addListener(ck_onReceiveError);
    chrome.sockets.udp.onReceive.addListener(ck_onReceive);

    chrome.system.network.getNetworkInterfaces(function (interfaces) {
        var i,
            intf;

        createCKSocket('0.0.0.0');

        for (i = 0; i < interfaces.length; i ++ ) {

            intf = interfaces[i];

            if (intf.address.split('.').length === 4) {
                createCKSocket(intf.address);
            }
        }
    });
}


function close_multi_sockets() {
    while (CK_SOCKET_ID.length > 0) {
        var socket_id = CK_SOCKET_ID.pop();

        chrome.sockets.udp.close(socket_id);
    }
}


function doXHR (msg, cb) {

    var p,
        xhr,
        params;

    xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    if (msg.type === 'blob' || msg.type === 'arraybuffer') {
        xhr.responseType = msg.type;
    }

    if (msg.action !== 'GET' || msg.action !== 'DELETE') {
        xhr.open(msg.action, msg.url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
    }

    else {
        params = '';
        if (msg.params) {
            for (p in msg.params) {
                params += (params ? '&' : '') + p + '=' + msg.params[p];
            }
        }
        xhr.open(msg.action, msg.url + (params ? '?' + params : ''), true);
    }

    xhr.onreadystatechange = function () {

        var reader;

        if (xhr.readyState === 4) {

            var response = {
                status : xhr.status,
                response : xhr.response
            };

            if (xhr.status === 200) {

                if (msg.type !== 'blob' && msg.type !== 'arraybuffer') {
                    response.response = msg.type === 'JSON' ? JSON.parse(xhr.responseText) : xhr.responseText;
                    cb && cb(response);
                }

                else {

                    reader = new window.FileReader();
                    reader.readAsDataURL(xhr.response);
                    reader.onloadend = function () {
                        response.response = reader.result;
                        cb && cb(response);
                    };
                }
            }

            else {
                cb && cb(response);
            }
        }
    }

    if (msg.action === 'GET' || msg.action === 'DELETE') {
        xhr.send();
    }

    else {
        xhr.send(JSON.stringify(msg.params));
    }
};

function onConnect (port) {


    PORTS.push(port);

    createV2Socket();

    create_multi_sockets();

    port.onMessage.addListener(function (msg, sender) {

        switch (msg.action) {
            case 'SCAN' :
                scanForDevices();
                break;

            case 'SCANv2' :
                scanForV2Devices();
                break;

            case 'SSH' :
                executeWizardApiSSHCommand(msg.params, port);
                break;

            case 'CHECK_SSH' :
                executeCheckSSHCommand(msg.params, port);
                break;

            case 'CUSTOM_SSH' :
                executeCustomSSHCommand(msg.params, port);
                break;

            case 'UniFi_Command' :
                executeUniFiCommand(msg.params, port);
                break;

            case 'V2_SOCKET_STATE' :
                getV2SocketState(port);
                break;

            default :
                break;
        }

    });

    port.onDisconnect.addListener(function (port) {
        var i = PORTS.indexOf(port);
        ~i && PORTS.splice(i, 1);

        if (PORTS.length === 0) {
            closeV2Socket();
            close_multi_sockets();
        }
    });
};

function onMessage (msg, sender, sendResponse) {

    if (msg === 'isInstalled') {
        sendResponse && sendResponse({
            isInstalled : true,
            version: chrome.runtime.getManifest().version
        });
    }

    if (
        msg.action === 'GET' ||
        msg.action === 'POST' ||
        msg.action === 'PUT' ||
        msg.action === 'PATCH' ||
        msg.action === 'DELETE'
    ) {
        doXHR(msg, sendResponse);
        return true;
    }
};

function isCaviumRouter(model) {
    return (model === 'UGW3' || model === 'UGW8')
}

function isVoipPhone(model) {
    return model === 'UP5' || model === 'UP5t' || model === 'UP7' ||
        model === 'UP5c' || model === 'UP5tc' || model === 'UP7c';
}

function executeUniFiCommand(params, port) {
    var progressCallback = null;
    if (params.cmd == "locate") {
        if (isVoipPhone(params.model)) {
            cmd = '/data/data/com.ubnt.uvp/files/dropbear/syswrapper.sh led-locate 30';
        } else {
            cmd = '/usr/bin/syswrapper.sh led-locate 30';
        }
    } else if (params.cmd == "set-inform") {
        if (isVoipPhone(params.model)) {
            cmd = '/data/data/com.ubnt.uvp/files/dropbear/syswrapper.sh set-inform ' + params.inform_url;
        } else {
            cmd = 'mca-ctrl -t connect -s ' + params.inform_url;
        }
    } else if (params.cmd == "reset") {
        if (isVoipPhone(params.model)) {
            cmd = '/data/data/com.ubnt.uvp/files/dropbear/syswrapper.sh restore-default';
        } else {
            cmd = 'mca-cli-op set-default';
        }
    } else if (params.cmd == "reboot") {
        if (isVoipPhone(params.model)) {
            cmd = '/data/data/com.ubnt.uvp/files/dropbear/syswrapper.sh restart';
        } else {
            cmd = 'mca-cli-op reboot';
        }
    } else if (params.cmd == "upgrade") {
        if (isVoipPhone(params.model)) {
            cmd = '/data/data/com.ubnt.uvp/files/dropbear/syswrapper.sh upgrade ' + params.upgrade_url;
        } else {
            cmd = 'mca-cli-op upgrade ' + params.upgrade_url;
        }
        progressCallback = function (state, isError) {
            port.postMessage({
                action: 'UNIFI_DEVICE_UPGRADE_STATE',
                state: state,
                isError: isError
            });
        };
    }

    var cmd_prefix = isCaviumRouter(params.model) ? 'sudo ' : '';
    var command = cmd_prefix + cmd;

    var finishCallback = function(code) {
        port.postMessage({
            action: 'UNIFI_COMMAND_COMPLETED',
            code: code
        });
    };
    ubnt.sshCommander.doSshCmd(params.ip, params.username, params.password, params.port, command, finishCallback, progressCallback);
};

function executeWizardApiSSHCommand(params, port) {
    var ssh_user = params.ssh_user || 'root',
      ssh_passwd = params.ssh_passwd || 'ubnt';

  executeSSHCommand(params.ip, ssh_user, ssh_passwd, buildWizardApiShellCommand(params), port, function(code) {
      port.postMessage({
          action: 'SSH_COMMAND_COMPLETED',
          code: code
      });
  });

  if (ssh_passwd === 'ubnt' && params.new_passwd) {
      executeSSHCommand(params.ip, ssh_user, ssh_passwd, buildPasswdShellCommand(params), port, function(code) {});
  }
}

function executeSSHCommand(ip, user, password, command, port, callback) {
    if (knownDevices[ip]) {
        ubnt.sshCommander.doSshCmd(ip, user, password, 22, command, callback);
    } else {
        port.postMessage({
            action: 'SSH_COMMAND_FAILED',
            reason: 'Invalid device'
        });
    }
}


function executeCustomSSHCommand(params, port) {
    executeSSHCommand(params.ip, params.ssh_user, params.ssh_passwd, params.command, port, function(code, output) {
        port.postMessage({
            action: 'CUSTOM_SSH_COMMAND_COMPLETED',
            code: code,
            output: output
        });
    });
}

function executeCheckSSHCommand(params, port) {
    executeSSHCommand(params.ip, 'root', 'ubnt', 'ls', port, function(code) {
        port.postMessage({
            action: 'CREDENTIALS_CHECK_COMPLETED',
            isDefaultCredentials: code === 0
        });
    });
}


function getV2SocketState(port) {
    port.postMessage({
      action: V2_SOCKET_ID > 0 ? "BINDING_V2_PORT_SUCCESS" : "BINDING_V2_PORT_FAILED",
    });
};

function buildWizardApiShellCommand(params) {
  return '/usr/lib/unifi/bin/wizard_api_sh "' +
    params.username + '" "' +
    params.password + '" "' +
    params.email + '" ' +
    params.countryCode + ' "' +
    params.timezone + '" "' +
    params.hostname + '" "' +
    params.ssoId + '"';
};

function buildPasswdShellCommand(params) {
  return 'echo -e "' + params.new_passwd + '\n' + params.new_passwd + '" | passwd ';
};


chrome.runtime.onMessage.addListener(onMessage);
chrome.runtime.onMessageExternal.addListener(onMessage);

chrome.runtime.onConnect.addListener(onConnect);
chrome.runtime.onConnectExternal.addListener(onConnect);

chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('../app.html', {
        bounds : {
            width : 1024,
            height : 600
        }
    });
});
