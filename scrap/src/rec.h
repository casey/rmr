#import "rmr.h"

namespace portaudio {
  class AutoSystem;
  class FunCallbackStream;
}

struct rec_t {
  struct update_t {
    double adc_time;
    double current_time;
    double dac_time;
    bool   input_underflow;
    bool   input_overflow;
    bool   output_underflow;
    bool   output_overflow;
    bool   priming_output;
    bool   ok;
    uint   frame_count;
    float* left;
    float* right;
    uint   result = 0;
    void   complete() { result = 1; }
    void   abort   () { result = 2; }
  };

  typedef std::function<void(update_t&)> callback_t;

  rec_t(uint frame_count, callback_t c);
  ~rec_t();

  callback_t callback;

private:
  unique_ptr<portaudio::AutoSystem>        autoSys;
  unique_ptr<portaudio::FunCallbackStream> stream;
};
