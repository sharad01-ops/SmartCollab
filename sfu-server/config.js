const os=require("os")
require("dotenv").config()


function getLocalIp() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {

            if (
                net.family === "IPv4" &&
                !net.internal &&
                (
                    net.address.startsWith("192.168") ||
                    net.address.startsWith("10.") ||
                    net.address.startsWith("172.")
                )
            ) {
                return net.address;
            }
        }
    }

    return "127.0.0.1"; // fallback
}




module.exports={
    routerOptions :
		{
			mediaCodecs :
			[
				{
					kind      : 'audio',
					mimeType  : 'audio/opus',
					clockRate : 48000,
					channels  : 2
				},
				{
					kind       : 'video',
					mimeType   : 'video/VP8',
					clockRate  : 90000,
					parameters :
					{
						'x-google-start-bitrate' : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/VP9',
					clockRate  : 90000,
					parameters :
					{
						'profile-id'             : 2,
						'x-google-start-bitrate' : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/h264',
					clockRate  : 90000,
					parameters :
					{
						'packetization-mode'      : 1,
						'profile-level-id'        : '4d0032',
						'level-asymmetry-allowed' : 1,
						'x-google-start-bitrate'  : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/h264',
					clockRate  : 90000,
					parameters :
					{
						'packetization-mode'      : 1,
						'profile-level-id'        : '42e01f',
						'level-asymmetry-allowed' : 1,
						'x-google-start-bitrate'  : 1000
					}
				}
			]
		},

	webRtcServerOptions :
		{
			listenInfos :
			[
				{
					protocol         : 'udp',
					ip               : process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
					announcedAddress : getLocalIp(),
					port             : 44444
				},
				{
					protocol         : 'tcp',
					ip               : process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
					announcedAddress : getLocalIp(),
					port             : 44444
				}
			]
		},
	
	
}