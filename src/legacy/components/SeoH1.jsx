// عنوان H1 مخفي بصريًا (للقارئات ومحركات البحث) من غير ما يغيّر شكل الصفحة.
const hidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function SeoH1({ children }) {
  return <h1 style={hidden}>{children}</h1>;
}
