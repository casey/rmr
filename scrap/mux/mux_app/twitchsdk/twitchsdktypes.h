/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#ifndef TTVSDK_TWITCH_SDK_TYPES_H
#define TTVSDK_TWITCH_SDK_TYPES_H

#include "errno.h"
#include "twitchcore/types/coretypes.h"

/**
 * TTV_AuthParams - Authentication parameters for broadcasting on Twitch. A broadcast key is ultimately needed; but it may be obtained by using username/password.
 */
typedef struct
{
	size_t size;						/* Size of the struct */
	const char* userName;				/* Twitch user name */
	const char* password;				/* Twitch password */	
	const char* clientSecret;			/* Twitch client secret */

} TTV_AuthParams;


/**
 * TTV_IngestServer - Represents a Twitch Ingest server
 */
#define kMaxServerNameLength 255
#define kMaxServerUrlLength 255
typedef struct
{	
	char serverName[kMaxServerNameLength+1];			/* The ingest server name */	
	char serverUrl[kMaxServerUrlLength+1];				/* The ingest server URL */	
	bool defaultServer;									/* Is this the default ingest server to use */

} TTV_IngestServer;


/**
 * TTV_IngestList - A list of ingest servers
 */
typedef struct
{
	TTV_IngestServer* ingestList;
	uint ingestCount;
} TTV_IngestList;


/**
 * TTV_PixelFormat - Supported input frame pixel formats
 */
typedef enum
{
	TTV_PF_BGRA = 0x00010203,
	TTV_PF_ABGR = 0x01020300,
	TTV_PF_RGBA = 0x02010003,
	TTV_PF_ARGB = 0x03020100

} TTV_PixelFormat;

/**
 * TTV_YUVFormat - Supported YUV convertion types
 */
typedef enum 
{
	TTV_YUV_NONE = -1,
	TTV_YUV_I420,		// 8 bit Y plane followed by 8 bit 2x2 subsampled U and V planes (12 bits/pixel)
	TTV_YUV_YV12,		// 8 bit Y plane followed by 8 bit 2x2 subsampled V and U planes (12 bits/pixel)
	TTV_YUV_NV12		// 8-bit Y plane followed by an interleaved U/V plane with 2x2 subsampling (12 bits/pixel)
} TTV_YUVFormat;

/**
 * TTV_EncodingCpuUsage - Set CPU usage level for video encoding
 *
 */
typedef enum
{	
	TTV_ECU_LOW,
	TTV_ECU_MEDIUM,
	TTV_ECU_HIGH
} TTV_EncodingCpuUsage;


/**
 * TTV_VideoEncoder - The video encoder to use
 */
typedef enum
{
	TTV_VID_ENC_DISABLE = -2,
	TTV_VID_ENC_DEFAULT = -1,

	TTV_VID_ENC_INTEL = 0,
	TTV_VID_ENC_APPLE = 2,
	TTV_VID_ENC_PLUGIN = 100
} TTV_VideoEncoder;

#define TTV_MIN_BITRATE 230
#define TTV_MAX_BITRATE 3500
#define TTV_MIN_FPS		10
#define TTV_MAX_FPS		60
#define TTV_MAX_WIDTH	1920				/* Width and height must be multiples of 16 */
#define TTV_MAX_HEIGHT	1200

class ITTVPluginVideoEncoder;

/**
 * TTV_VideoParams - Video parameters
 */
typedef struct
{
	size_t size;							/* Size of the struct */
	uint outputWidth;						/* Width of the output video stream in pixels */
	uint outputHeight;						/* Height of the output video stream in pixels */
	TTV_PixelFormat pixelFormat;			/* Frame pixel format */
	uint maxKbps;							/* Max bit rate */
	uint targetFps;							/* Target frame rate */
	TTV_EncodingCpuUsage encodingCpuUsage;	/* CPU usage level for video encoding */
	bool disableAdaptiveBitrate;			/* By default the SDK attempts to match the targetBitrate (set in maxKbps above) in cases where frames are submitted at a lower rate than target FPS. You can disable this feature */
	bool verticalFlip;						/* Flip the frames vertically - This incurs a performance penalty on some platforms (e.g. iOS) */
	ITTVPluginVideoEncoder* encoderPlugin;	/* (optional) Pointer to your own h264 encoder instance. SDK Assumes the pointer is valid at TTV_Start and stays valid until TTV_Stop completes */
} TTV_VideoParams;


/**
 * TTV_AudioEncoder - The audio encoder to use
 */
typedef enum
{
	TTV_AUD_ENC_DEFAULT = -1,

	TTV_AUD_ENC_LAMEMP3 = 0,
	TTV_AUD_ENC_APPLEAAC = 1,
} TTV_AudioEncoder;


/**
 * TTV_AudioSampleFormat - Supported input audio sample formats
 */
typedef enum
{
	TTV_ASF_PCM_S16							/* PCM signed 16-bit */

} TTV_AudioSampleFormat;


/**
 * TTV_AudioParams - Audio parameters
 */
typedef struct
{
	size_t size;						/* Size of the struct */
	bool audioEnabled;					/* Is audio enabled? */
	bool enableMicCapture;				/* The SDK will do microphone capture */
	bool enablePlaybackCapture;			/* The SDK will capture system audio (Not available on all platforms, e.g. iOS) */
	bool enablePassthroughAudio;		/* The client will supply audio samples directly to the SDK (can be in addition to or instead of playback and/or mic capture) */
} TTV_AudioParams;


typedef enum TTV_AudioDeviceType
{
	TTV_PLAYBACK_DEVICE,				/* System audio capture */
	TTV_RECORDER_DEVICE,				/* Microphone capture */
	TTV_PASSTHROUGH_DEVICE,				/* Audio data supplied by the client */

	TTV_DEVICE_NUM
} TTV_AudioDeviceType;


typedef enum
{
	TTV_ST_RTMPSTATE,
	TTV_ST_RTMPDATASENT
} TTV_StatType;

#define TTV_RTMP_LAST_CONNECT_STATE 6

/**
 * Callback signature for buffer unlock
 */
typedef void (*TTV_BufferUnlockCallback) (const uint8_t* buffer, void* userData);


/**
 * Callback signature for Stats reporting
 */
typedef void (*TTV_StatCallback) (TTV_StatType type, uint64_t data);

/**
 * TTV_VideoFrame - Input video frame parameters
 */
typedef struct
{
	size_t size;							/* Size of the struct */
	uint8_t* frameBuffer;					/* Raw bytes of the frame - the frame resolution MUST match the resolution of the output video */
	TTV_BufferUnlockCallback callback;		/* callback that gets called when VideoFrame is no longer needed */
	void* userData;							/* userData passed to the callback */
	uint64_t mTimeStamp;					/* For internal use */
} TTV_VideoFrame;

/**
* TTV_AuthToken - The max length of a Twitch authentication token.
*/
const uint kAuthTokenBufferSize = 128;

/**
 * TTV_AuthToken - The authentication token returned after successfully authenticating with username and password.
 */
typedef struct
{
	char data[kAuthTokenBufferSize];		/* The token data. */
} TTV_AuthToken;

/**
 * TTV_UserInfo - The user name
 */
#define kMaxUserNameLength 63
typedef struct
{
	size_t size;				/* The size of the struct. */
	char displayName[kMaxUserNameLength+1];				/* The displayed name */	
	char name[kMaxUserNameLength+1];					/* The user name */	
} TTV_UserInfo;

/**
* TTV_ChannelInfo - The channel info
*/
#define kMaxChannelUrlLength 255
typedef struct
{
	size_t size;			/* The size of the struct. */
	char name[kMaxUserNameLength+1];				/* The channel name */
	char displayName[kMaxUserNameLength+1];				/* The displayed channel name (which may be different) */
	char channelUrl[kMaxChannelUrlLength+1];			/* The URL to that channel */
} TTV_ChannelInfo;

/**
 * TTV_StreamInfo - The stream info
 */
typedef struct
{
	size_t size;				/* The size of the struct. */
	int viewers;				/* The current viewer count. */
	uint64_t streamId;			/* The unique id of the stream. */
} TTV_StreamInfo;

/**
 * TTV_StreamInfoForSetting - The stream info
 */
#define kMaxStreamTitleLength 255
#define kMaxGameNameLength 255
typedef struct
{
	size_t size;				/* The size of the struct. */
	char streamTitle[kMaxStreamTitleLength+1];			/* The title of the stream. If the first character is null, this parameter is ignored. */
	char gameName[kMaxGameNameLength+1];				/* The name of the game being played. If the first character is null, this parameter is ignored. */	
} TTV_StreamInfoForSetting;

/**
* TTV_RecordingStatus - The Video recording status of the channel
*/
#define kMaxCureUrlLength 255
typedef struct
{
	size_t size;				/* The size of the struct. */
	bool recordingEnabled;							/* Recording is enabled/disabled for the channel */
	char cureUrl[kMaxCureUrlLength+1];				/* The URL for where the user can go to enable video recording for the channel */
} TTV_ArchivingState;

/**
 * TTV_GameInfo - Display information about a game.
 */
typedef struct
{	
	char name[kMaxGameNameLength+1]; 	/* The display name of the game. */
	int popularity; 					/* A popularity rating for the game. */
	int id; 							/* The game's unique id. */

} TTV_GameInfo;

/**
 * TTV_GameInfoList - A list of game info structs.
 */
typedef struct
{
	TTV_GameInfo* list;			/* The array of game info entries */
	unsigned int count;			/* The number of entries in the array. */

} TTV_GameInfoList;

/**
 * TTV_GameLiveStreamInfo - Information about a live stream of a particular game
 */
typedef struct
{
	char channelUrl[kMaxChannelUrlLength+1];
	char previewUrlTemplate[kMaxChannelUrlLength+1];
	char streamTitle[kMaxStreamTitleLength+1];
	char channelDisplayName[kMaxUserNameLength+1];
	unsigned int viewerCount;
} TTV_LiveGameStreamInfo;

/**
 * TTV_LiveGameStreamList - List of live streams of a given game
 */
typedef struct
{
	TTV_LiveGameStreamInfo* list;		/* The array of live game stream info entries */
	unsigned int count;					/* The number of entries in the array */
} TTV_LiveGameStreamList;

/**
 * All the valid flags for TTV_Start()
 */

#define TTV_Start_BandwidthTest 0x1

/**
 * All of the valid flags for TTV_RequestAuthToken()
 */
#define TTV_RequestAuthToken_Broadcast	(1 << 0)
#define TTV_RequestAuthToken_Chat		(1 << 1)

#endif	/* TTVSDK_TWITCH_SDK_TYPES_H */
