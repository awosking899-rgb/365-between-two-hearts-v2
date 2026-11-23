// تعريف الذكريات — لا شيء هنا مخترع: كل نص إما من أمر المشروع أو من رسالتك الأصلية.
window.G=window.G||{};
G.imgFull=function(id){return 'assets/'+id.split('_')[0]+'/'+id+'.jpg';};
G.imgTex =function(id){return 'assets/tex/'+id+'.jpg';};
G.pad=function(n){return (n<10?'0':'')+n;};
G.SETS={
  birthday:[1,2,3,4,5,6,7,8,9,10,11,12,13].map(function(n){return 'birthday_'+G.pad(n);}),
  // 14 صورة (الصورة 13 هي صورة الأفتارات وتُعرض في ركن الأفتارات)
  gallery:[3,6,9,5,4,15,1,7,14,11,2,10,12,8].map(function(n){return 'photos_'+G.pad(n);})
};
G.ALL_IMAGES=[].concat(G.SETS.birthday,G.SETS.gallery,['photos_13','memories_01']);
G.AUDIO=[
  {id:'voice_1',title:'تسجيل ١',src:'assets/audio/voice_01.mp3'},
  {id:'voice_2',title:'تسجيل ٢',src:'assets/audio/voice_02.mp3'},
  {id:'voice_3',title:'تسجيل ٣',src:'assets/audio/voice_03.mp3'},
  {id:'voice_4',title:'تسجيل ٤',src:'assets/audio/voice_04.mp3'}
];
G.MEM={
  first:{kind:'image',title:'أول رسالة',img:'memories_01',caption:'١١ فبراير · ١٢:٥٩ ص',style:'phone'},
  confession:{kind:'chat',title:'الاعتراف'},
  name:{kind:'card',style:'glass',title:'حديقة الاسم',html:'<h3>سلام</h3><div>هنا أخبرتني بانا أن اسمها سلام.</div>'},
  calls:{kind:'card',style:'glass',title:'شارع المكالمات',html:'<h3>المكالمات</h3><div>كل مكالمة جمعتنا مرّت من هذا الشارع.</div>'},
  avatars:{kind:'image',title:'ركن الأفتارات',img:'photos_13',caption:'الأفتارات والأطقم التي اخترناها',style:'plain'},
  granny:{kind:'card',style:'neon',title:'جراني',html:'<h3>جراني</h3><div>لعبناها معًا.</div>'},
  roblox:{kind:'card',style:'neon',title:'روبلوكس',html:'<h3>روبلوكس</h3><div>لعبناها معًا.</div>'},
  bomb:{kind:'card',style:'neon',title:'فرقة القنبلة',html:'<h3>فرقة القنبلة</h3><div>لعبناها معًا.</div>'},
  minecraft:{kind:'card',style:'neon',title:'ماينكرافت',html:'<h3>ماينكرافت</h3><div>لعبناها معًا.</div>'},
  nakd:{kind:'card',style:'sunny',title:'أيام النكد',html:'<h3>أيام النكد 😝</h3><div>الأيام اللي كان فيها نكد… وانتهت بضحك.</div>'},
  zaal:{kind:'card',style:'sunny',title:'الزعل المتعمد',html:'<h3>الزعل المتعمد 🙄</h3><div>زعل ما كان بجد… وصلح بعده دايمًا.</div>'},
  funny:{kind:'card',style:'sunny',title:'مواقف أضحكتنا',html:'<h3>مواقف أضحكتنا 😂</h3><div>المواقف اللي جعلتنا نضحك.</div>'},
  cinema:{kind:'card',style:'glass',title:'سينما فارس عاشور',html:'<h3>سينما فارس عاشور</h3><div>كنّا نشاهد فارس عاشور معًا.</div>'},
  understand:{kind:'card',style:'paper',title:'محطة التفاهم',html:'<h3>محطة التفاهم</h3><div>نكبر وننضج ونتعلم من أخطائنا ونبقى نختار بعض حتى في الأيام اللي ما تكون مثاليه.</div><div class="sub">التسامح والتعلّم والاعتذار والنضج.</div>'},
  dialect:{kind:'words',title:'ركن اللهجة',words:['بانتييي','يب','حتنىى!','أحبششش'],note:'أحب لهجتها… وأحب أن أحكي بلهجتها، وهذا يجعلها تضحك.'},
  finale:{kind:'finale',title:'رسالة الذكرى السنوية'}
};
// أنماط الدائرة الصوتية
G.VOICE_MEM=G.AUDIO.map(function(a){return a.id;});
