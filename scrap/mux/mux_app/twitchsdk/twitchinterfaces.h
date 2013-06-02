/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#ifndef TTVSDK_TWITCH_INTERFACES_H
#define TTVSDK_TWITCH_INTERFACES_H

#include "twitchsdktypes.h"
#include "twitchcore/types/errortypes.h"

// Need C++ to use these interfaces
#ifdef __cplusplus
class ITTVBuffer
{
public:
	virtual size_t Append (uint8_t* data, size_t dataSize) = 0;
	virtual size_t Reserve (size_t newSize) = 0;
	virtual uint8_t* Data() = 0;
	virtual const uint8_t* Data() const = 0;
	virtual size_t Size() = 0;
};

/**
* ITTVPluginVideoEncoder - Pure Interface for video encoders
*
* Implement this class if you would like twitchSDK to use your
* own encoder instead of the supplied default encoders.
*/
class ITTVPluginVideoEncoder
{
public:
	/**
	* Structure passed into EncodeFrame with details about the 
	* source data
	*/
	struct EncodeInput
	{
		/**
		* source - Parameter that will hold the pointer to the 
		* surface that was passed in during the call to 
		* TTV_SubmitVideoFrame. The data pointed to will
		* not have been modified.
		*/
		const uint8_t* source;

		/**
		* yuvPlanes - Buffers that will contain the converted
		* and _flipped if requested_ image data. The pointers
		* will correspond to the buffers of the YUV conversion
		* requested in GetRequiredYUVFormat(). If the YUV 
		* conversion is not requested (TTV_YUV_NONE)
		* these pointers will be null
		*/
		const uint8_t* yuvPlanes[4];

		/**
		* timeStamp - The internal timestamp of the frame
		* being encoded. Ensure that the output frame that
		* corresponds to the inputframe has the corresponding
		* timestamp
		*/
		uint64_t timeStamp;
	};
	/**
	* Structure passed into EncodeFrame that will receieve
	* details about the encoded data
	*/
	struct EncodeOutput
	{
		/**
		* frameData - Buffer to store the output of the encoding.
		* Do not persist this pointer, it will become invalid after
		* EncodeFrame returns
		*/
		ITTVBuffer* frameData;

		/**
		* isKeyFrame - Denotes if the encoded frame is a keyframe (IDR or I)
		*/
		bool isKeyFrame;
		
		/**
		* frameTimeStamp - The timestamp of the input frame that this output
		* frame corresponds to
		*/
		uint64_t frameTimeStamp;
	};

	/**
	* Start - Called when the encoder is started up
	*
	* @param[in] videoParams - Parameters needed by the encoder.
	* @return TTV_EC_SUCCESS on success
	*/
	virtual TTV_ErrorCode Start(const TTV_VideoParams* videoParams) = 0;

	/**
	* EncodeFrame - Encode a frame of video.
	* @param[in] input - See remarks
	* @param[out] output - See remarks
	*
	* @return TTV_EC_SUCCESS on success
	*         TTV_WRN_NOMOREDATA on success without any output
	*
	* @Remarks
	*
	* Due to the async / buffered nature of encoders, not even call to
	* EncodeFrame has to return the h264 encoded data for that specific frame
	*
	* If the encoder needs to buffer up the input frame before an output frame
	* can be emitted, return TTV_WRN_NOMOREDATA and make sure not to add data
	* to the frameData member of output
	*
	* When shutting down the encoder, EncodeFrame will be called with empty 
	* input packets (source pointer will be null). This will happen until
	* there is no output received
	*/
	virtual TTV_ErrorCode EncodeFrame(const EncodeInput& input, EncodeOutput& output) = 0;

	/**
	* GetSpsPps - Get the Sps/Pps values for the encode session
	*
	* @return TTV_EC_SUCCESS on success
	*/
	virtual TTV_ErrorCode GetSpsPps(ITTVBuffer* outSps, ITTVBuffer* outPps) = 0;

	/**
	* GetRequiredYUVFormat - If the encoder requires image data to be converted to YUV, 
	* return the value of the specific format you would like. If you need the image
	* flipped vertically, this is where it will be done too.
	*/
	virtual TTV_YUVFormat GetRequiredYUVFormat() const = 0;
};

#endif // __cplusplus
#endif	/* TTVSDK_TWITCH_INTERFACES_H */
