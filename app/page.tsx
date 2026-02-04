export default function Home() {
  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h1 className="h1">منصة الطلاب الذكية 🎓</h1>
          <p className="p">
            سجل حسابك، فعّل كود التجربة، وبعدها افتح الشات.  
            التجربة 7 أيام بكود من الأدمن.
          </p>

          <div className="hr" />

          <div className="row">
            <a className="btn" href="/register">ابدأ الآن</a>
            <a className="btn secondary" href="/redeem">تفعيل كود</a>
          </div>

          <div style={{ marginTop: 12 }} className="small">
            Trial: جهاز واحد + IP واحد ✅ | Paid لاحقًا: جهازين + IPين ✅
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="badge">✨ Features</div>
          <div className="hr" />
          <div className="msg">✅ تسجيل دخول بحساب (Supabase Auth)</div>
          <div className="msg">✅ تفعيل Trial Code لمدة 7 أيام</div>
          <div className="msg">✅ حماية ضد التحايل (Cookies + Fingerprint + IP)</div>
          <div className="msg">✅ Admin Dashboard لتوليد الأكواد</div>
        </div>
      </div>
    </div>
  );
}
