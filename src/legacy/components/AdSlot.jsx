// مكان محجوز لإعلانات AdSense مستقبلاً - مخفي حاليًا بدون أي مساحة ظاهرة في الواجهة.
// لتفعيله لاحقًا: احذف style={{ display: 'none' }} وحط كود AdSense جوه الـ div.
export default function AdSlot({ id }) {
  return <div className="ad-slot-hidden" data-ad-slot={id} style={{ display: 'none' }} />;
}
