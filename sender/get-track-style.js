export default function () {
  const styles = {
    backgroundColor: '#00000000',
    foregroundColor: '#FFFFFFFF',
    edgeType: chrome.cast.media.TextTrackEdgeType.OUTLINE,
    edgeColor: '#000000FF',
    fontStyle: chrome.cast.media.TextTrackFontStyle.NORMAL,
    fontFamily: 'Open Sans',
    fontGenericFamily: chrome.cast.media.TextTrackFontGenericFamily.SANS_SERIF,
    windowType: chrome.cast.media.TextTrackWindowType.NONE
  };

  const textTrackStyle = new chrome.cast.media.TextTrackStyle();
  Object.assign(textTrackStyle, styles);

  return textTrackStyle;
}
