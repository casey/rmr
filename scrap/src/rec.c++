#import "rec.h"

#import "portaudiocpp/PortAudioCpp.hxx"

static int record_callback(
  const void*                     input,
  void*                           output,
  unsigned long                   numframes,
  const PaStreamCallbackTimeInfo* timeinfo,
  PaStreamCallbackFlags           statusFlags,
  void*                           userData
) {
  rec_t& r(*(rec_t*)userData);

  if (r.callback) {
    rec_t::update_t u{};
    u.adc_time         = timeinfo->inputBufferAdcTime;
    u.dac_time         = timeinfo->outputBufferDacTime;
    u.current_time     = timeinfo->currentTime;
    u.input_underflow  = statusFlags & paInputUnderflow;
    u.input_overflow   = statusFlags & paInputOverflow;
    u.output_underflow = statusFlags & paOutputUnderflow;
    u.output_overflow  = statusFlags & paOutputOverflow;
    u.priming_output   = statusFlags & paPrimingOutput;
    u.frame_count      = numframes;
    u.left             = ((float**)input)[0];
    u.right            = ((float**)input)[1];
    u.ok               = !(
      u.input_underflow || u.input_overflow  || u.output_underflow || u.output_overflow || u.priming_output
    );
    u.result           = 0; // continue by default

    r.callback(u);
    return u.result;
  }

  return 0;
}

rec_t::rec_t(uint frame_count, callback_t c) : callback(c), autoSys(new portaudio::AutoSystem) {
  auto& input = portaudio::System::instance().defaultInputDevice();
  rmr.info("Opening recording input stream on "s + input.name());

  portaudio::DirectionSpecificStreamParameters inParamsRecord(
    input
  , 2
  , portaudio::FLOAT32
  , false
  , input.defaultLowInputLatency()
  , NULL);

  portaudio::StreamParameters paramsRecord(
    inParamsRecord
  , portaudio::DirectionSpecificStreamParameters::null()
  , 44100.0
  , frame_count
  , paClipOff);

  stream.reset(new portaudio::FunCallbackStream(paramsRecord, record_callback, this));
  stream->start();
};

rec_t::~rec_t() {};
