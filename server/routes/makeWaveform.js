const waveform = require('waveform-util');

// ... via waveform-util module documentation:
// 
// Generate peaks from a given audio file path. All parameters are required:
// waveform.generate_peaks(audio_path, target_width, duration, bit_rate, channels, callback);
// Parameters:
//   - audio_path: relative or absolute path to an audio file of *nearly* any type*
//   - target_width: how many entries you want in the output peaks array.
//         This is useful, for example, if you want to draw a
//         200px-wide waveform: each peak becomes a line 1px wide.
//   - duration: Duration of the audio in (fractional) seconds
//   - bit_rate: Bit rate of the audio file
//   - channels: Number of channels in the audio (e.g. 1 for mono, 2 for stereo)
//   - callback: callback function with `err` and `peaks_obj` as parameters
//
// The peaks_obj parameter in the callback will be an object with the format
// { peaks: [], max_peak: Number }

module.exports = {
  go: function (filePath, targetWidth, callback) {

    function waveformDone(err, peaks_obj) {
      // console.log(peaks_obj.peaks) // Array of peak values e.g. [0.75, 0.2, 0.1111,...]
      // console.log(peaks_obj.max_peak) // Max peak in the signal: useful for scaling the peak values when drawing them
      if (err && !peaks_obj) {
        callback(err);
      } else {
        callback(null, peaks_obj.peaks);
      }
    }

    waveform.audio_data(filePath, function(err, fileData){
      console.log(err, fileData);
      if (err && !fileData) {
        console.log('ERROR');
        callback(err);
      }
      else {
        waveform.generate_peaks(filePath,
          targetWidth,
          fileData.duration,
          fileData.bit_rate,
          fileData.channels,
          waveformDone);
      }
    });
  }

};
