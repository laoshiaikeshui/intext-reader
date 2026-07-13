const encoder = new TextEncoder();
const bytes = (value) => encoder.encode(value);

module.exports = {
  "META-INF/container.xml": bytes(`<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="OPS/content.opf"/></rootfiles></container>`),
  "OPS/content.opf": bytes(`<package xmlns="http://www.idpf.org/2007/opf" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>EPUB Two</dc:title></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="one" href="one.xhtml" media-type="application/xhtml+xml"/></manifest><spine toc="ncx"><itemref idref="one"/></spine></package>`),
  "OPS/toc.ncx": bytes(`<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/"><navMap><navPoint><navLabel><text>Named from NCX</text></navLabel><content src="one.xhtml"/></navPoint></navMap></ncx>`),
  "OPS/one.xhtml": bytes(`<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Only body text.</p></body></html>`)
};
