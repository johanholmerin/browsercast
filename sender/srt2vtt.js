/**
 * Based on https://github.com/mafintosh/srt-to-vtt
 * @author mafintosh
 * @license MIT
 */
export default function (srt) {
  const body = srt
    .replace(/\{\\([ibu])\}/g, '</$1>')
    .replace(/\{\\([ibu])1\}/g, '<$1>')
    .replace(/\{([ibu])\}/g, '<$1>')
    .replace(/\{\/([ibu])\}/g, '</$1>')
    .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');

  return `WEBVTT FILE\n\n${body}`;
}
