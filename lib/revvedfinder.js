'use strict';
var path = require('path');

// Allow to find, on disk, the revved version of a furnished file, bellow a given
// directory
//
// +base_dir+  : the base repository which will be the root for our search
// +expandfn+ : a function that will return a list of file matching a given pattern (for example grunt.file.expand)
//
var RevvedFinder = module.exports = function (expandfn) {
    this.expandfn = expandfn;
  };

//
// Find revved version of file, relatively to the furnished +basedir+
// Find a revved version of +ofile+ (i.e. a file which name is ending with +ofile+), relatively
// to the furnished +basedir+.
// Let's imagine you have the following directory structure:
//  + build
//  |  |
//  |  +- css
//  |      |
//  |      + style.css
//  + images
//     |
//     + 2123.pic.png
//
// and that somehow style.css is referencing '../../images/pic.png'
// When called like that:
//   revvedFinder.find('../../images/pic.png', 'build/css');
// the function must return
// '../../images/2123.pic.png'
//
RevvedFinder.prototype.find = function find(ofile, basedir) {
    var file = ofile;
    var startAtRoot = false;

    //do not touch external files or the root
    if (ofile.match(/\/\//) || ofile.match(/^\/$/)) {
      return ofile;
    }

    // Consider reference from site root
    if (ofile.match(/^\//)) {
      file = ofile.substr(1);
      startAtRoot = true;
    }

    // Our filename
    var basename = path.basename(file);
    // The path (possibly relative) to the file we're the revved looking for
    var dirname = path.dirname(file);
    // Normalized path from cwd to the file directory
    var normalizedDirname = path.normalize([basedir, dirname].join('/'));

    // Basically: starting at the current cwd we're looking for all the
    // files that are ending with the filename we've been asked to looked a revved version for
    // Once we found a couple of these files, we're filtering them out to be sure their path
    // is matching the path of the original file (to avoid clashes when there's a images/2123.test.png and
    // a images/misc/4567.test.png for example)
    var filepaths = this.expandfn('**/*' + basename);
    var re = new RegExp('\\d+\\.' + basename + '$');
    var filepath = filepaths.filter(function (f) {
        return f.match(re) && (normalizedDirname === path.dirname(f));
      })[0];

    // not a file in temp, skip it
    if (!filepath) {
      return ofile;
    }

    var filename = path.basename(filepath);
    // handle the relative prefix (with always unix like path even on win32)
    if (dirname !== '.') {
      filename = [dirname, filename].join('/');
    }

    // if file not exists probaly was concatenated into another file so skip it
    if (!filename) {
      return '';
    }

    // Do not forget to start from root if this was the case of the input

    return startAtRoot ? '/' + filename : filename;
  };
