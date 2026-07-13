const encoder = new TextEncoder();

function bytes(value) {
  return encoder.encode(value);
}

module.exports = {
  "META-INF/container.xml": bytes(`<?xml version="1.0"?>
    <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
      <rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles>
    </container>`),
  "EPUB/package.opf": bytes(`<?xml version="1.0"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>多语言测试</dc:title><dc:creator>Author</dc:creator><dc:language>zh</dc:language>
      </metadata>
      <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="c1" href="Text/ch1.xhtml" media-type="application/xhtml+xml"/>
        <item id="c2" href="Text/ch2.xhtml" media-type="application/xhtml+xml"/>
        <item id="pic" href="Images/pic.jpg" media-type="image/jpeg"/>
        <item id="pic2" href="Images/pic2.png" media-type="image/png"/>
        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
        <item id="rule" href="Images/rule.png" media-type="image/png"/>
        <item id="svg" href="Images/map.svg" media-type="image/svg+xml"/>
      </manifest>
      <spine><itemref idref="c1"/><itemref idref="c2"/></spine>
    </package>`),
  "EPUB/nav.xhtml": bytes(`<html xmlns="http://www.w3.org/1999/xhtml"><body>
    <nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol>
      <li><a href="Text/ch1.xhtml">第一章 开始</a></li>
      <li><a href="Text/ch2.xhtml#top">第二章 続き</a></li>
      <li><a href="Text/ch2.xhtml#later">第三章 End</a></li>
    </ol></nav></body></html>`),
  "EPUB/Text/ch1.xhtml": bytes(`<html xmlns="http://www.w3.org/1999/xhtml"><body>
    <h1>第一章 开始</h1><p><img src="../Images/cover.jpg"/>中文 English <ruby>日<rt>に</rt></ruby>本語 한국어.</p>
    <p><img src="../Images/rule.png" width="600" height="2"/></p>
  </body></html>`),
  "EPUB/Text/ch2.xhtml": bytes(`<html xmlns="http://www.w3.org/1999/xhtml"><body>
    <p id="top">Second paragraph.</p><figure>
      <img src="../Images/pic.jpg" width="24" height="24"/>
      <img src="../Images/pic2.png" width="800" height="600" alt="Scene"/>
      <figcaption>Two illustrations</figcaption>
    </figure><h2 id="later">Third heading</h2><p>Final text.</p><p><img src="../Images/map.svg"/></p>
  </body></html>`),
  "EPUB/Images/pic.jpg": new Uint8Array([1, 2, 3]),
  "EPUB/Images/pic2.png": new Uint8Array([4, 5, 6]),
  "EPUB/Images/cover.jpg": new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
  "EPUB/Images/rule.png": new Uint8Array([7]),
  "EPUB/Images/map.svg": bytes("<svg/>")
};
