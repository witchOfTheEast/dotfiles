var port,
    family,
    searchTerm,
    sortProp,
    sortDirection,
    DEVICES,
    SEARCH_TIMEOUT;

var ubnt = ubnt || {};

// mapping from device_mac to device object
var devices = {};

// both cleanUpDevices function and updateDevice function will get access to DEVICES array
// set the lock when cleaning devices and release the lock when it is done
var lock = false;

family = 'AirOS';
searchTerm = '';

port = chrome.runtime.connect();

DEVICES = [];

port.onMessage.addListener(function (msg) {
    var device;
    if (msg.action === 'DEVICE_DISCOVERED') {
        updateDevice(msg.device);
    } else if (msg.action === 'UNIFI_COMMAND_COMPLETED') {
        onUniFiCmdComplete(msg.code);
    } else if (msg.action === 'UNIFI_DEVICE_UPGRADE_STATE') {
        onUniFiDeviceUpgradeState(msg);
    } else if (msg.action === 'BINDING_V2_PORT_SUCCESS') {
        $('#unifi-status').empty();
        if (family === 'UniFi') {
            $('.device-count').show();
        }
    } else if (msg.action === 'BINDING_V2_PORT_FAILED') {
        $('#unifi-status').text('Failed to initialize UDP port 10001');
        if (family === 'UniFi') {
            $('.device-count').hide();
        }
    } else if (msg.action === 'SCAN_COMPLETED') {
    }
});

function formatMac(mac) {
    return (
        mac.replace(/\-/g, '')
        .replace(/\:/g, '')
        .match(/.{1,2}/g)
        .join(':').toUpperCase()
    );
};

function stripFirmware (firmware) {
    var a = firmware.split('.');
    return a.splice(2, a.length - 5).join('.');
};

function toggleFamily () {
    family = (family === 'UniFi') ? 'AirOS' : 'UniFi';
    if (family === 'UniFi') {
        $('.airos').hide();
        $('.unifi').show();
        $('#scan-btn').hide();
        $('#toggle-btn').removeClass("appMainButton--secondary").addClass("appMainButton--secondaryDark");
        port.postMessage({action : 'V2_SOCKET_STATE'});
    } else {
        $('.device-count').show();
        $('.unifi').hide();
        $('.airos').show();
        $('#scan-btn').show();
        $('#toggle-btn').removeClass("appMainButton--secondaryDark").addClass("appMainButton--secondary");
    }
    renderList();
};

function openManageDialog(event) {
    mac = event.target.id;
    openDialog("manage", mac);
}

function openDialog(type, mac){
    $("#dialog .inform-url-row").hide();
    $("#dialog .upgrade-url-row").hide();
    if (type=="manage"){
        $("#dialog .inform-url-row").show();
        $("#dialog .action-selector").val("set-inform");
    } else if(type=="locate"){
        $("#dialog .action-selector").val("locate");
    } else if(type=="reset"){
        $("#dialog .action-selector").val("reset");
    } else if(type=="reset"){
        $("#dialog .upgrade-url-row").show();
        $("#dialog .action-selector").val("upgrade");
    }

    $("#dialog .mac").text(formatMac(mac));
    if (devices[mac]) {
        device = devices[mac];
        $("#dialog .status").text(getStatus(device));
        $("#dialog .ip").text(device.ip);
        $("#dialog .model").text(device.display);
        $("#dialog .hostname").text(device.hostname);
        $("#dialog .version").text(device.short_ver);
    }

    $("#dialog .action-selector").change(function(){
        var selector = $("#dialog .action-selector").val();
        if(selector=="set-inform"){
            $("#dialog .inform-url-row").show();
        } else {
            $("#dialog .inform-url-row").hide();
        }
        if(selector=="upgrade"){
            $("#dialog .upgrade-url-row").show();
        } else {
            $("#dialog .upgrade-url-row").hide();
        }
    });

    $("#dialog .apply-btn").unbind();
    $("#dialog .apply-btn").on('click', onClickUniFiActionButton);

    $("#dialog .cancel-btn").on('click', function(){
        $("#dialog .apply-btn").unbind();
        $("#dialog .cancel-btn").unbind();
        $("#dialog .action-selector").unbind();
        $("#dialog .status").css('color', 'black');

        $.modal.close();
    });

    $("#dialog").modal({
        escapeClose: false,
        clickClose: false,
        showClose: false
    });
}

function onClickUniFiActionButton() {
    $('#dialog .apply-btn').attr("disabled", true);
    $('#dialog .cancel-btn').attr("disabled", true);

    var params = {};
    params.cmd = $("#dialog .action-selector").val();
    params.username = $("#dialog .username").val();
    params.password = $("#dialog .password").val();
    params.inform_url = $("#dialog .inform-url").val();
    params.upgrade_url = $("#dialog .upgrade-url").val();
    params.ip = device.ip;
    params.model = device.model;
    params.port = device.sshd_port || 22;

    port.postMessage({action: 'UniFi_Command', params: params});
}

function onUniFiCmdComplete(code) {
    if(code==0){
        // success ssh
        $.modal.close();
    } else if(code==255){
        $("#dialog .status").text("Login Failed");
        $("#dialog .status").css('color', 'red');
    } else if(code!==100){
        $("#dialog .status").text("Cannot Connect");
        $("#dialog .status").css('color', 'red');
    }
    $('#dialog .apply-btn').attr("disabled", false);
    $('#dialog .cancel-btn').attr("disabled", false);
}

var DEVICE_UPGRADE_STATES = {
  'DOWNLOADING': 'Downloading firmware... please wait.',
  'DOWNLOAD_COMPLETED': 'Download completed, upgrading...',
  'DOWNLOAD_FAILED': 'Download failed.',
  'INVALID_FIRMWARE': 'Invalid firmware.'
};

function onUniFiDeviceUpgradeState(msg) {
    $("#dialog .status").text(DEVICE_UPGRADE_STATES[msg.state]);
    $("#dialog .status").css('color', msg.isError ? 'red' : 'orange');
    $('#dialog .apply-btn').attr("disabled", msg.isError ? false : true);
    $('#dialog .cancel-btn').attr("disabled", false);
}

function scanDevices () {
    if (family === 'UniFi') {
        port.postMessage({action : 'SCANv2'});
    } else {
        port.postMessage({action : 'SCAN'});
    }
};

function clearDevices () {
    DEVICES = DEVICES.filter(function (model) { return model.family !== family });
    updateSort();
    renderList();
};

function updateDevice (device) {
    var i,
        item,
        html,
        deviceFound;

    if (!device.mac) {
        return;
    }

    if(lock==true){
        setTimeOut(function(){
            updateDevice(device);
        }, 100);
    }

    device.firmware = stripFirmware(device.firmware);
    device.model = device.model || device.platform;

    for (i = 0; i < DEVICES.length; i ++) {
        item = DEVICES[i];
        if (item.mac === device.mac) {
            deviceFound = true;
            item.family = device.family;
            item.model = device.model;
            item.hostname = device.hostname;
            item.ip = device.ip;
            item.firmware = device.firmware;
            item.short_ver = device.short_ver;
            item.is_default = device.is_default;
            if (device.hasOwnProperty('timestamp')) {
                item.timestamp = device.timestamp;
            }
            updateDeviceRow(item);
            if (deviceMatchesSearchTerm(item)) {
                showDevice(item);
                updateDeviceCount();
            }
            else {
                hideDevice(item);
                updateDeviceCount();
            }
        }
    }

    if (!deviceFound) {
        device.formattedMac = formatMac(device.mac);
        device.row = createDeviceRow(device);
        updateDeviceRow(device);

        if (!deviceMatchesSearchTerm(device)) {
            hideDevice(device);
        }

        DEVICES.push(device);
        devices[device.mac] = device;

        updateDeviceCount();

        $('#device-tbody').append(device.row);
    }
};

function renderList() {
    var i,
        tbody,
        device,
        doesMatch;

    tbody = $('#device-tbody');
    tbody.html('');

    if (sortProp) {
        DEVICES.sort(function (a, b) {
            var i,
                p,
                p2;
            if (sortProp === 'ip') {
                if (a.ip === b.ip) {
                    return 0;
                }
                p = a.ip.split('.');
                p2 = b.ip.split('.');
                for (i = 0; i < 4; i ++) {
                    p[i] = parseInt(p[i], 10);
                    p2[i] = parseInt(p2[i], 10);
                }
                if (p[0] === p2[0]) {
                    if (p[1] === p2[1]) {
                        if (p[2] === p2[2]) {
                            return p[3] > p2[3] ? 1 : -1;
                        }
                        return p[2] > p2[2] ? 1 : -1;
                    }
                    return p[1] > p2[1] ? 1 : -1;
                }
                return p[0] > p2[0] ? 1 : -1;
            }
            if (sortProp === 'status') {
                return getStatus(a).localeCompare(getStatus(b));
            }
            return a[sortProp].localeCompare(b[sortProp]);
        });

        if (sortDirection === 'desc') {
            DEVICES.reverse();
        }
    }

    for (i = 0; i < DEVICES.length; i ++) {
        device = DEVICES[i];
        if (deviceMatchesSearchTerm(device)) {
            showDevice(device);
        }
        else {
            hideDevice(device);
        }
        tbody.append(device.row);
    }
    updateDeviceCount();
};

function deviceMatchesSearchTerm (device) {
    var i,
        p,
        searchable;
    searchable = [
        'ip',
        'mac',
        'hostname',
        'model',
        'display',
        'formattedMac'
    ];

    if (device.family !== family) {
        return false;
    }

    if (!searchTerm) {
        return true;
    }

    for (i = 0; i < searchable.length; i++) {
        p = searchable[i];
        if ((device[p] ? device[p].toLowerCase() : '').search(searchTerm.toLowerCase()) > -1) {
            return true;
        }
    }
    return false;
};

function getStatus(device) {
    if (device.is_default === true){
        return "Pending";
    } else if (device.is_default === false){
        return "Managed/Adopted";
    }
    return "Unknown";
};

function hideDevice (device) {
    device.isHidden = true;
    device.row.addClass('is-hidden');
};

function showDevice (device) {
    device.isHidden = false;
    device.row.removeClass('is-hidden');
};

function createDeviceRow (device) {
    return $(
        '<tr data-mac="' + device.mac + '"></tr>'
    );
};

function updateDeviceRow (device) {
    function deviceLink () {
        if (device.family === 'UniFi' && !device.is_cloudkey) {
            return device.ip;
        }
        var port,
            proto;

        port = device.webPort ? ':' + device.webPort : '';
        proto = device.webProtocol ? device.webProtocol + '://' : 'http://';
        return '<a href="' + proto + device.ip + port + '" target="_blank">' + device.ip + "</a>";
    };

    function deviceModel() {
        return device.display;
    }

    function deviceFirmware() {
        if (device.family === 'UniFi') {
            return device.short_ver;
        } else {
            return device.firmware;
        }
    }

    function formattedButton(device, name, text) {
        var style = 'appMainButton appMainButton--secondary appMainButton--cozy ';
        return '<button class="' + style + name + '" id="' + device.mac + '">' + text + '</button>';
    }
    function deviceAction() {
        if (device.family === 'UniFi' && !device.is_cloudkey) {
            return formattedButton(device, 'manage-btn', 'Action');
        } else {
            return '';
        }
    }

    // <button class="appMainButton appMainButton--primary appMainButton--cozy" id="scan-btn">Scan</button>
    device.row.html(
        '<td width="15%">' + deviceModel(device) + '</td>' +
        '<td class="airos" width="20%">' + device.hostname + '</td>' +
        '<td width="10%">' + deviceLink(device) + '</td>' +
        '<td width="15%"><code>' + device.formattedMac + '</code></td>' +
        '<td width="15%">' + deviceFirmware(device) + '</td>' +
        '<td class="unifi" width="15%">' + getStatus(device) + '</td>' +
        '<td class="unifi" width="10%">' + deviceAction(device) + '</td>'
    );

    if (family === 'UniFi') {
        device.row.find('.airos').hide();
        device.row.find('.unifi').show();
    } else {
        device.row.find('.unifi').hide();
        device.row.find('.airos').show();
    }

    $('.manage-btn').unbind();
    $('.manage-btn').on('click', openManageDialog);
};

function updateDeviceCount () {
    var count = 0;
    for (i = 0; i < DEVICES.length; i ++) {
        if (!DEVICES[i].isHidden) {
            count ++;
        }
    }
    $('#device-count').html(count);
};

function updateSearchTerm (e) {
    searchTerm = $('#search-field').val();
    if (SEARCH_TIMEOUT) {
        clearTimeout(SEARCH_TIMEOUT);
        SEARCH_TIMEOUT = null;
    }
    SEARCH_TIMEOUT = setTimeout(renderList, 100);
};

function updateSort (e) {
    var $el;
    if (e) {
        $el = $(e.currentTarget);
        if ($el.hasClass('is-column-sorted')) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        }
        else {
            sortDirection = 'asc';
        }
        sortProp = $el.data('sortBy');
    }
    else {
        sortProp = null;
    }

    $('[data-sort-by].is-column-sorted').removeClass('is-column-sorted')
        .find('.sort-arrow')
        .removeClass('ubnt-icon--arrow-up-4')
        .addClass('ubnt-icon--arrow-down-4');

    if ($el) {
        $el.addClass('is-column-sorted');
        if (sortDirection === 'desc') {
            $el.find('.sort-arrow')
                .removeClass('ubnt-icon--arrow-down-4')
                .addClass('ubnt-icon--arrow-up-4');
        }
        else {
            $el.find('.sort-arrow')
                .removeClass('ubnt-icon--arrow-up-4')
                .addClass('ubnt-icon--arrow-down-4');
        }
    }

    renderList();
};


function cleanUpDevices(){
    lock=true;
    var now = Math.round(+new Date()/1000);
    var NEWDEVICES = [];
    for (i = 0; i < DEVICES.length; i ++) {
        device = DEVICES[i];

        if (device.hasOwnProperty('timestamp')) {
            if (now-device.timestamp > 30) {
                continue;
            }
        }

        NEWDEVICES.push(device);
    }
    DEVICES = NEWDEVICES;
    renderList();
    lock=false;
}


$(function () {

    $('.unifi').hide();
    $('#toggle-btn').on('click', toggleFamily);

    $('#scan-btn').on('click', scanDevices);
    $('#find-cloud-key-btn').on('click', scanDevices);
    $('#clear-btn').on('click', clearDevices);

    $('[data-sort-by]').on('click', updateSort);

    $('#search-field').on('keyup', updateSearchTerm);

    setInterval(function(){
        cleanUpDevices();
    }, 30000);

    scanDevices();
});
