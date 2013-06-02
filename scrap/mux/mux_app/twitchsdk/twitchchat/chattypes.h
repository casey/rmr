/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#pragma once

#include "twitchcore/types/errortypes.h"
#include "twitchcore/types/coretypes.h"

/**
 * TTV_ChatTokenizationOption - Controls the way chat messages are passed to the client.  If tokenization is disabled then TTV_ChatChannelRawMessageCallback
 * will be called in the chat callbacks structure.  Otherwise, it will call TTV_ChatChannelTokenizedMessageCallback.
 * This is a bitfield but not all flags are compatible, such as parsing emoticons as URLS and textures.
 */
typedef enum
{
	TTV_CHAT_TOKENIZATION_OPTION_NONE					= 0,		//!< Don't apply tokenization and fire callbacks via TTV_ChatChannelRawMessageCallback.
	TTV_CHAT_TOKENIZATION_OPTION_EMOTICON_URLS			= 1 << 0,	//!< Pass emoticon URLs when tokenizing.  Not compatible with TTV_CHAT_TOKENIZATION_OPTION_EMOTICON_TEXTURES.
	TTV_CHAT_TOKENIZATION_OPTION_EMOTICON_TEXTURES		= 1 << 1	//!< Pass texture atlas coordinates when tokenizing.  Not compatible with TTV_CHAT_TOKENIZATION_OPTION_EMOTICON_URLS.

} TTV_ChatTokenizationOption;

/**
 * TTV_ChatEvent - The various events coming from the chat system.
 */
typedef enum
{
	TTV_CHAT_JOINED_CHANNEL,			//!< Local user joined a channel.
	TTV_CHAT_LEFT_CHANNEL				//!< Local user left a channel.

} TTV_ChatEvent;


/**
 * TTV_ChatUserMode - A list of the mode flags a user may have.
 */
typedef enum
{
	TTV_CHAT_USERMODE_VIEWER		= 0,		//!< A regulare viewer.

	TTV_CHAT_USERMODE_MODERATOR		= 1 << 0,	//!< A moderator.
	TTV_CHAT_USERMODE_BROADCASTER	= 1 << 1,	//!< The broadcaster.
	TTV_CHAT_USERMODE_ADMINSTRATOR	= 1 << 2,	//!< An admin.
	TTV_CHAT_USERMODE_STAFF			= 1 << 3,	//!< A member of Twitch.

	TTV_CHAT_USERMODE_BANNED		= 1 << 30	//!< The user has been banned.  This flag may not always be up to date.

} TTV_ChatUserMode;


/**
 * TTV_ChatUserSubscription - A list of the subscription flags a user may have.
 */
typedef enum
{
	TTV_CHAT_USERSUB_NONE			= 0,		//!< A standard user.

	TTV_CHAT_USERSUB_SUBSCRIBER		= 1 << 0,	//!< A subscriber in the current channel.
	TTV_CHAT_USERSUB_TURBO			= 1 << 1	//!< A Twitch Turbo account.

} TTV_ChatUserSubscription;


/**
 * This is the maximum length of the user name in bytes, NOT characters.  Be careful with multi-byte characters in UTF-8.  
 * However, user names are currently restricted to ASCII which is confined to the lower 7 bits so the encodings are the same.
 */
#define kMaxChatUserNameLength 63
/**
 * TTV_ChatUserInfo - The user information.
 */
typedef struct
{	
	utf8char displayName[kMaxChatUserNameLength+1];		//!< The UTF-8 encoded displayed name.  Currently restricted to the ASCII subset.
	TTV_ChatUserMode modes;								//!< The mode which controls priviledges in a particular chat room.
	TTV_ChatUserSubscription subscriptions;				//!< The user's subscriptions for the channel.
	uint32_t nameColorARGB;								//!< The current ARGB color of the user's name text.
	bool ignore;										//!< Whether or not to ignore the user.

} TTV_ChatUserInfo;


/**
 * TTV_ChatUserList - A list of chat users.
 */
typedef struct
{
	TTV_ChatUserInfo* userList;		//!< The array of user info entries.
	uint32_t userCount;			//!< The number of entries in the array.

} TTV_ChatUserList;


/**
 * This is the maximum length of the channel name in bytes, NOT characters.  Be careful with multi-byte characters in UTF-8.  
 * However, user names are currently restricted to ASCII which is confined to the lower 7 bits so the encodings happen to be the same (for now).
 */
#define kMaxChatChannelNameLength 63
/**
 * TTV_ChatChannelInfo - Information about a chat channel.
 */
typedef struct
{
	utf8char name[kMaxChatChannelNameLength+1];			//!< The UTF-8 encoded name of the channel.  Currently restricted to the ASCII subset.
	TTV_ChatUserInfo broadcasterUserInfo;				//!< Information about the broadcaster of the stream.

} TTV_ChatChannelInfo;


/**
 * This is the maximum length of the message in bytes, NOT characters.  Be careful with multi-byte characters in UTF-8.
 */
#define kMaxChatMessageLength 510
/**
 * TTV_ChatRawMessage - A message from a user in a chat channel that does not have emoticon info.
 */
typedef struct
{
	utf8char userName[kMaxChatUserNameLength+1];		//!< The UTF-8 encoded user that sent the message.  Currently restricted to the ASCII subset.
	utf8char message[kMaxChatMessageLength+1];			//!< The UTF-8 encoded message text.
	TTV_ChatUserMode modes;								//!< The mode which controls priviledges in a particular chat room.
	TTV_ChatUserSubscription subscriptions;				//!< The user's subscriptions for the channel.
	uint32_t nameColorARGB;								//!< The ARGB color of the name text.
	bool action;										//!< Whether or not the message is an action.  If true, it should be displayed entirely in the name text color and of the form "<userName> <message>".

} TTV_ChatRawMessage;


/**
 * TTV_ChatRawMessageList - A list of chat messages which do not contain emoticon info.
 */
typedef struct
{
	TTV_ChatRawMessage* messageList;				//!< The ordered array of chat messages.
	uint32_t messageCount;							//!< The number of messages in the list.

} TTV_ChatRawMessageList;


/**
 * TTV_ChatMessageTokenType - The types of tokens that can be generated from a chat message.
 */
typedef enum
{
	TTV_CHAT_MSGTOKEN_TEXT,
	TTV_CHAT_MSGTOKEN_TEXTURE_IMAGE,
	TTV_CHAT_MSGTOKEN_URL_IMAGE

} TTV_ChatMessageTokenType;


/**
 * TTV_ChatTextMessageToken - Information about a text token.
 */
typedef struct
{
	utf8char buffer[kMaxChatMessageLength];
	
} TTV_ChatTextMessageToken;


/**
 * TTV_ChatTextureImageMessageToken - Information about an image token that is specified by a location in the texture altas.
 */
typedef struct
{
	int32_t sheetIndex;		//!< The index of the sheet to use when rendering.  -1 means no image.
	uint16_t x1;			//!< The left edge in pixels on the sheet.
	uint16_t y1;			//!< The top edge in pixels on the sheet.
	uint16_t x2;			//!< The right edge in pixels on the sheet.
	uint16_t y2;			//!< The bottom edge in pixels on the sheet.

} TTV_ChatTextureImageMessageToken;


#define kMaxChatImageUrlLength 139

/**
 * TTV_ChatUrlImageMessageToken - Information about an image token that is specified by a URL.
 */
typedef struct
{
	utf8char url[kMaxChatImageUrlLength+1];		//!< The URL of the image.
	uint16_t width;								//!< The width of the image in pixels.
	uint16_t height;							//!< The height of the image in pixels.

} TTV_ChatUrlImageMessageToken;


/**
 * TTV_ChatMessageToken - Information about an image token.
 */
typedef struct 
{
	TTV_ChatMessageTokenType type;	//!< The way to interpret the data.

	union
	{
		TTV_ChatTextMessageToken text;
		TTV_ChatTextureImageMessageToken textureImage;
		TTV_ChatUrlImageMessageToken urlImage;
	} data;
	
} TTV_ChatMessageToken;


/**
 * TTV_ChatTokenizedMessage - A list of tokens parsed from a text message.
 */
typedef struct
{
	utf8char displayName[kMaxChatUserNameLength+1];		//!< The UTF-8 encoded displayed name.  Currently restricted to the ASCII subset.
	TTV_ChatUserMode modes;								//!< The modes of the user who sent the message.
	TTV_ChatUserSubscription subscriptions;				//!< The subscriptions of the user who sent the message.
	uint32_t nameColorARGB;								//!< The current ARGB color of the user's name text.
	TTV_ChatMessageToken* tokenList;					//!< The array of message tokens.
	uint32_t tokenCount;								//!< The number of entries in tokenList.
	bool action;										//!< Whether or not the message is an action.  If true, it should be displayed entirely in the name text color and of the form "<userName> <message>".

} TTV_ChatTokenizedMessage;


/**
 * TTV_ChatTokenizedMessageList - A list of chat messages which have been tokenized.
 */
typedef struct
{
	TTV_ChatTokenizedMessage* messageList;			//!< The ordered array of tokenized chat messages.
	uint32_t messageCount;							//!< The number of messages in the list.

} TTV_ChatTokenizedMessageList;


/**
 * TTV_ChatSpriteSheet - The texture data which can be loaded into a texture and used for rendering emoticons and badges.
 */
typedef struct
{
	uint32_t sheetIndex;			//!< The index of the sprite sheet.
	const uint8_t* buffer;			//!< The RGBA buffer data, 8 bits per channel.
	uint16_t width;					//!< The width of the buffer in pixels.
	uint16_t height;				//!< The height of the buffer in pixels.

} TTV_ChatTextureSheet;


/**
 * TTV_ChatTextureSheetList - A list of texture sheets.
 */
typedef struct
{
	TTV_ChatTextureSheet* list;			//!< The array of sheets.
	uint32_t count;					//!< The number of entries in the array.

} TTV_ChatTextureSheetList;


/**
 * TTV_ChatBadgeData - Information about how to render badges based on the subscriptions and user modes for a specific channel.
 */
typedef struct
{
	utf8char channel[kMaxChatChannelNameLength+1];
	TTV_ChatTextureSheetList textures;

	TTV_ChatMessageToken turboIcon;
	TTV_ChatMessageToken channelSubscriberIcon;
	TTV_ChatMessageToken broadcasterIcon;
	TTV_ChatMessageToken staffIcon;
	TTV_ChatMessageToken adminIcon;
	TTV_ChatMessageToken moderatorIcon;

} TTV_ChatBadgeData;


/**
 * TTV_ChatEmoticonData - Information to use when rendering emoticons for all channels.
 */
typedef struct 
{
	TTV_ChatTextureSheetList textures;

} TTV_ChatEmoticonData;


/**
 * TTV_ChatInitializationCallback - The callback to the client indicated the result of the chat system initializing.  Once this is called
 * and indicates success the client will now be able to initiate a connection and download emoticon data.
 *
 * @param error The result code of the initialization.  TTV_EC_SUCCESS indicates success.
 * @param userdata The custom data provided by the client.
 */
typedef void (*TTV_ChatInitializationCallback) (TTV_ErrorCode error, void* userdata);


/**
 * TTV_ChatShutdownCallback - The callback to the client indicated the result of the chat system shutting down.  Once this is called the 
 * chat system is no longer available until reinitialized.
 *
 * @param error The result code of the initialization.  TTV_EC_SUCCESS indicates success.
 * @param userdata The custom data provided by the client.
 */
typedef void (*TTV_ChatShutdownCallback) (TTV_ErrorCode error, void* userdata);

/**
 * Callback signature for connection and disconnection events from the chat service.  Once a connecion is successful, this may be
 * called at any time to indicate a disconnect from the server.  If a disconnection occurs, TTV_ChatConnect must be called again
 * to connect to the server and all channels must be rejoined.
 *
 * When a connection is attempted via TTV_ChatConnect, a successful connection will result in the callback being called with TTV_EC_SUCCESS.
 * Otherwise, an error will be returned which can be one of TTV_EC_CHAT_INVALID_LOGIN, TTV_EC_CHAT_LOST_CONNECTION, TTV_EC_CHAT_COULD_NOT_CONNECT.
 *
 * @param result The connection change.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatStatusCallback) (TTV_ErrorCode result, void* userdata);

/**
 * Callback signature for result of the local user joining or leaving channels.
 *
 * Expected evt values are TTV_CHAT_JOINED_CHANNEL, TTV_CHAT_LEFT_CHANNEL.
 *
 * @param evt The membership event.
 * @param channelInfo The channel info.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatChannelMembershipCallback) (TTV_ChatEvent evt, const TTV_ChatChannelInfo* channelInfo, void* userdata);

/**
 * Callback signature for notifications of users joining, leaving or changing their attributes in a chat channel.  The lists returned in this callback must be freed by 
 * calling TTV_Chat_FreeUserList on each one when the application is done with them.
 *
 * @param joinList The list of users that joined the channel.
 * @param leaveList The list of users that left the channel.
 * @param infoChangeList The list of users that have had their properties updated.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatChannelUserChangeCallback) (const TTV_ChatUserList* joinList, const TTV_ChatUserList* leaveList, const TTV_ChatUserList* infoChangeList, void* userdata);

/**
 * Callback signature for notifications of a raw message event occurring in chat.  This list is freed automatically when the call to the callback returns
 * so be sure not to retain a reference to the list.
 *
 * @param messageList The list of messages.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatChannelMessageCallback) (const TTV_ChatRawMessageList* messageList, void* userdata);

/**
 * Callback signature for notifications of a tokenized message event occurring in chat.  This list is NOT freed automatically when the call to the callback returns
 * so be sure to call TTV_Chat_FreeTokenizedMessageList when done with the list.
 *
 * @param messageList The list of messages.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatChannelTokenizedMessageCallback) (const TTV_ChatTokenizedMessageList* messageList, void* userdata);

/**
 * Callback signature for notifications that the chatroom should be cleared.
 *
 * @param username The username in which to clear the messages for.  If this is NULL then messages for all users should be cleared.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_ChatClearCallback) (const utf8char* username, void* userdata);

/**
 * Callback to indicate the result of the request to fetch emoticon or badge data.
 *
 * @param error Specifies any error or warning that may have occurred while preparing the emoticon data.
 * @param userdata The userdata specified in TTV_ChatCallbacks.
 */
typedef void (*TTV_EmoticonDataDownloadCallback) (TTV_ErrorCode error, void* userdata);

/**
 * TTV_ChatCallbacks - The set of callbacks to call for notifications from the chat subsystem.  Either messageCallback or tokenizedMessageCallback must not be NULL.
 */
typedef struct
{
	TTV_ChatStatusCallback					statusCallback;				//!< The callback to call for connection and disconnection events from the chat service. Cannot be NULL.
	TTV_ChatChannelMembershipCallback		membershipCallback;			//!< The callback to call when the local user joins or leaves a channel. Cannot be NULL.
	TTV_ChatChannelUserChangeCallback		userCallback;				//!< The callback to call when other users join or leave a channel. This may be NULL.
	TTV_ChatChannelMessageCallback			messageCallback;			//!< The callback to call when raw messages are received on a channel. 
	TTV_ChatChannelTokenizedMessageCallback	tokenizedMessageCallback;	//!< The callback to call when tokenized messages are received on a channel. 
	TTV_ChatClearCallback					clearCallback;				//!< The callback to call when the chatroom should be cleared. Can be NULL.
	void*									unsolicitedUserData;		//!< The userdata to pass in the callbacks.

} TTV_ChatCallbacks;
