/* ═══════════════════════════════════════════════════════════════
   ARTICLE ADMIN PANEL — Add this to your index.html app
   
   This is the React component that goes inside the Adm() admin component.
   You'll add a new tab "blog" alongside post/signal/manage/users/rewards.
   
   STEP 1: Run the SQL in articles-setup.sql first.
   STEP 2: Add the new tab to the admin tabs array.
   STEP 3: Add the AdminBlog component below.
   STEP 4: Render it when tb === "blog".
   ═══════════════════════════════════════════════════════════════ */

/* ───── Add this new component anywhere in index.html ───── */

function AdminBlog({token,onR}){
  const{t,lang}=useLang();
  const[articles,setArticles]=useState([]);
  const[loading,setLoading]=useState(false);
  const[editing,setEditing]=useState(null); // null | 'new' | article object
  const[ms,setMs]=useState("");

  // Form state
  const[title,setTitle]=useState("");
  const[slug,setSlug]=useState("");
  const[subtitle,setSubtitle]=useState("");
  const[excerpt,setExcerpt]=useState("");
  const[content,setContent]=useState("");
  const[category,setCategory]=useState("general");
  const[tags,setTags]=useState("");
  const[readTime,setReadTime]=useState(5);
  const[coverImage,setCoverImage]=useState("");
  const[coverFile,setCoverFile]=useState(null);
  const[coverPreview,setCoverPreview]=useState("");
  const[metaTitle,setMetaTitle]=useState("");
  const[metaDesc,setMetaDesc]=useState("");
  const[metaKeywords,setMetaKeywords]=useState("");
  const[published,setPublished]=useState(true);

  const CATEGORIES=[
    {k:"general",l:"General"},
    {k:"fundamentals",l:"Fundamentals"},
    {k:"strategy",l:"Strategy"},
    {k:"central-banks",l:"Central Banks"},
    {k:"gold",l:"Gold"},
    {k:"forex",l:"Forex"},
    {k:"crypto",l:"Crypto"},
    {k:"analysis",l:"Analysis"},
  ];

  // Auto-generate slug from title
  const slugify=(s)=>s.toLowerCase()
    .replace(/[^\w\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'')
    .slice(0,80);

  useEffect(()=>{
    if(editing==='new'&&title&&!slug){
      setSlug(slugify(title));
    }
  },[title]);

  // Load articles
  const loadArticles=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${SB}/rest/v1/Articles?order=created_at.desc&select=*`,{headers:H(token)});
      const d=await r.json();
      if(Array.isArray(d))setArticles(d);
    }catch(e){console.error(e)}
    setLoading(false);
  };

  useEffect(()=>{loadArticles()},[token]);

  const resetForm=()=>{
    setTitle("");setSlug("");setSubtitle("");setExcerpt("");setContent("");
    setCategory("general");setTags("");setReadTime(5);
    setCoverImage("");setCoverFile(null);setCoverPreview("");
    setMetaTitle("");setMetaDesc("");setMetaKeywords("");
    setPublished(true);
  };

  const startNew=()=>{
    resetForm();
    setEditing('new');
  };

  const startEdit=(a)=>{
    setTitle(a.title||"");
    setSlug(a.slug||"");
    setSubtitle(a.subtitle||"");
    setExcerpt(a.excerpt||"");
    setContent(a.content||"");
    setCategory(a.category||"general");
    setTags(a.tags||"");
    setReadTime(a.read_time||5);
    setCoverImage(a.cover_image||"");
    setCoverPreview(a.cover_image||"");
    setMetaTitle(a.meta_title||"");
    setMetaDesc(a.meta_desc||"");
    setMetaKeywords(a.meta_keywords||"");
    setPublished(a.published!==false);
    setEditing(a);
  };

  const cancelEdit=()=>{
    setEditing(null);
    resetForm();
  };

  const handleCoverFile=(e)=>{
    const f=e.target.files[0];
    if(f){
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  };

  const save=async()=>{
    if(!title||!content||!slug){
      setMs("Title, slug, and content are required");
      return;
    }
    setLoading(true);
    setMs("");
    try{
      // Upload cover image if new file
      let imgUrl=coverImage;
      if(coverFile){
        const uploaded=await api.img(coverFile,token);
        if(uploaded)imgUrl=uploaded;
        else{setMs("Image upload failed");setLoading(false);return}
      }

      const data={
        slug,
        title,
        subtitle:subtitle||null,
        excerpt:excerpt||null,
        content,
        cover_image:imgUrl||null,
        category,
        tags:tags||null,
        read_time:parseInt(readTime)||5,
        meta_title:metaTitle||null,
        meta_desc:metaDesc||null,
        meta_keywords:metaKeywords||null,
        published,
      };

      if(editing==='new'){
        await api.add("Articles",data,token);
        setMs("Article published!");
      }else{
        await api.patch("Articles",editing.id,data,token);
        setMs("Article updated!");
      }

      cancelEdit();
      loadArticles();
    }catch(e){
      setMs(e.message||"Save failed");
    }
    setLoading(false);
  };

  const del=async(id)=>{
    if(!confirm("Delete this article? This cannot be undone."))return;
    try{
      await api.del("Articles",id,token);
      setMs("Article deleted");
      loadArticles();
    }catch(e){setMs(e.message)}
  };

  // ═══ EDIT FORM ═══
  if(editing){
    return(
      <div className="fi">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700}}>
            {editing==='new'?"New Article":"Edit Article"}
          </div>
          <div onClick={cancelEdit} style={{cursor:"pointer",color:"var(--mu)",fontSize:12,fontWeight:600}}>← Cancel</div>
        </div>

        {ms&&<div style={{
          background:ms.includes("!")?"color-mix(in srgb,var(--G) 8%,transparent)":"color-mix(in srgb,var(--R) 8%,transparent)",
          border:`1px solid ${ms.includes("!")?"color-mix(in srgb,var(--G) 15%,transparent)":"color-mix(in srgb,var(--R) 15%,transparent)"}`,
          borderRadius:10,padding:10,marginBottom:10,fontSize:13,
          color:ms.includes("!")?"var(--G)":"var(--R)"
        }}>{ms}</div>}

        {/* Cover image upload */}
        <div onClick={()=>document.getElementById("articleCoverFu").click()} style={{
          border:"1.5px dashed var(--brd2)",borderRadius:14,padding:24,textAlign:"center",
          marginBottom:10,background:"var(--bg2)",cursor:"pointer",overflow:"hidden"
        }}>
          {coverPreview
            ? <img src={coverPreview} style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:10}} alt=""/>
            : <div style={{fontSize:13,color:"var(--dm)"}}>Tap to upload cover image (16:9 recommended)</div>
          }
        </div>
        <input id="articleCoverFu" type="file" accept="image/*" onChange={handleCoverFile} style={{display:"none"}}/>

        {/* Title */}
        <input className="ip" placeholder="Article title" value={title} onChange={e=>setTitle(e.target.value)}/>

        {/* Slug */}
        <input className="ip" placeholder="URL slug (auto-generated)" value={slug} onChange={e=>setSlug(slugify(e.target.value))}/>
        <div style={{fontSize:11,color:"var(--dm)",marginBottom:8,marginTop:-4}}>
          URL: /blog/article.html?slug={slug||"..."}
        </div>

        {/* Subtitle */}
        <input className="ip" placeholder="Subtitle (optional)" value={subtitle} onChange={e=>setSubtitle(e.target.value)}/>

        {/* Excerpt */}
        <textarea
          className="ip"
          placeholder="Short excerpt (shown on blog index, ~150 chars)"
          value={excerpt}
          onChange={e=>setExcerpt(e.target.value)}
          rows={2}
          style={{resize:"vertical"}}
        />

        {/* Category */}
        <div style={{fontSize:11,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}>Category</div>
        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
          {CATEGORIES.map(c=>
            <div key={c.k} onClick={()=>setCategory(c.k)} style={{
              padding:"7px 14px",borderRadius:10,cursor:"pointer",
              background:category===c.k?"color-mix(in srgb,var(--R) 10%,transparent)":"transparent",
              border:`1px solid ${category===c.k?"color-mix(in srgb,var(--R) 25%,transparent)":"var(--brd)"}`,
              fontSize:12,fontWeight:600,color:category===c.k?"var(--R)":"var(--mu)"
            }}>{c.l}</div>
          )}
        </div>

        {/* Read time */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:12,color:"var(--mu)"}}>Read time:</span>
          <input
            className="ip"
            type="number"
            value={readTime}
            onChange={e=>setReadTime(e.target.value)}
            style={{width:80,marginBottom:0}}
            min="1"
            max="60"
          />
          <span style={{fontSize:12,color:"var(--mu)"}}>minutes</span>
        </div>

        {/* Tags */}
        <input className="ip" placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)}/>

        {/* Content (HTML) */}
        <div style={{fontSize:11,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}>
          Content (HTML — use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.)
        </div>
        <textarea
          className="ip"
          placeholder="<p>Your article content here...</p><h2>A heading</h2><p>More text...</p>"
          value={content}
          onChange={e=>setContent(e.target.value)}
          rows={15}
          style={{resize:"vertical",fontFamily:"monospace",fontSize:12}}
        />

        {/* SEO Section */}
        <div style={{
          marginTop:16,padding:14,
          background:"color-mix(in srgb,var(--B) 5%,transparent)",
          border:"1px solid color-mix(in srgb,var(--B) 15%,transparent)",
          borderRadius:12
        }}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:"var(--B)"}}>SEO (Optional but recommended)</div>
          <input
            className="ip"
            placeholder="Meta title (defaults to article title)"
            value={metaTitle}
            onChange={e=>setMetaTitle(e.target.value)}
          />
          <textarea
            className="ip"
            placeholder="Meta description (~160 chars, shown in Google results)"
            value={metaDesc}
            onChange={e=>setMetaDesc(e.target.value)}
            rows={2}
            style={{resize:"vertical"}}
          />
          <input
            className="ip"
            placeholder="Meta keywords (comma separated)"
            value={metaKeywords}
            onChange={e=>setMetaKeywords(e.target.value)}
            style={{marginBottom:0}}
          />
        </div>

        {/* Publish toggle */}
        <div onClick={()=>setPublished(!published)} className="cd" style={{
          padding:12,marginTop:12,marginBottom:8,cursor:"pointer",
          display:"flex",justifyContent:"space-between",alignItems:"center"
        }}>
          <span style={{fontSize:13}}>Published (visible on blog)</span>
          <div style={{
            width:40,height:22,borderRadius:11,
            background:published?"var(--G)":"var(--brd2)",
            position:"relative",transition:".2s"
          }}>
            <div style={{
              width:18,height:18,borderRadius:9,background:"#fff",
              position:"absolute",top:2,left:published?20:2,transition:".2s"
            }}/>
          </div>
        </div>

        {/* Save button */}
        <button
          className="bt"
          style={{background:"var(--R)",opacity:loading?.5:1,marginTop:8}}
          onClick={save}
          disabled={loading}
        >
          {loading?"Saving...":(editing==='new'?"Publish Article":"Save Changes")}
        </button>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return(
    <div className="fi">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600}}>
          Blog Articles ({articles.length})
        </div>
        <button
          onClick={startNew}
          style={{
            padding:"8px 16px",borderRadius:10,
            background:"var(--R)",color:"#fff",
            fontSize:12,fontWeight:600,border:"none",cursor:"pointer"
          }}
        >+ New Article</button>
      </div>

      {ms&&<div style={{
        background:ms.includes("!")||ms.includes("deleted")?"color-mix(in srgb,var(--G) 8%,transparent)":"color-mix(in srgb,var(--R) 8%,transparent)",
        border:`1px solid ${ms.includes("!")||ms.includes("deleted")?"color-mix(in srgb,var(--G) 15%,transparent)":"color-mix(in srgb,var(--R) 15%,transparent)"}`,
        borderRadius:10,padding:10,marginBottom:10,fontSize:13,
        color:ms.includes("!")||ms.includes("deleted")?"var(--G)":"var(--R)"
      }}>{ms}</div>}

      {loading&&articles.length===0&&<div style={{textAlign:"center",color:"var(--dm)",padding:40,fontSize:13}}>Loading...</div>}

      {!loading&&articles.length===0&&<div style={{textAlign:"center",color:"var(--dm)",padding:40,fontSize:13}}>
        No articles yet. Click "New Article" to create your first one.
      </div>}

      {articles.map(a=>
        <div key={a.id} className="cd" style={{
          display:"flex",alignItems:"center",gap:10,padding:12,marginBottom:6
        }}>
          {a.cover_image
            ? <img src={a.cover_image} style={{width:52,height:36,borderRadius:6,objectFit:"cover"}} alt=""/>
            : <div style={{width:52,height:36,borderRadius:6,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📰</div>
          }
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {a.title}
            </div>
            <div style={{fontSize:10,color:"var(--dm)",marginTop:2}}>
              {a.category} · {a.read_time} min · {a.created_at?new Date(a.created_at).toLocaleDateString():""} · {a.views||0} views
            </div>
          </div>
          {!a.published&&<span style={{fontSize:8,fontWeight:700,color:"var(--Y)",padding:"2px 5px",borderRadius:4,background:"color-mix(in srgb,var(--Y) 10%,transparent)"}}>DRAFT</span>}
          <div onClick={()=>startEdit(a)} style={{cursor:"pointer",color:"var(--B)",padding:4}}>{IC.edit}</div>
          <div onClick={()=>del(a.id)} style={{cursor:"pointer",color:"var(--R)",padding:4}}>{IC.del}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INTEGRATION INSTRUCTIONS
   ═══════════════════════════════════════════════════════════════ */

/*

STEP 1: Find this line in the Adm() component:
  {["post","signal","manage","users","rewards"].map(tab=>{

CHANGE IT TO (add "blog" to the array):
  {["post","signal","blog","manage","users","rewards"].map(tab=>{

ALSO update the labels object on the next line:
  const labels={post:lang==="fa"?"پست":"Post",signal:lang==="fa"?"سیگنال":"Signal",blog:lang==="fa"?"بلاگ":"Blog",manage:lang==="fa"?"مدیریت":"Manage",users:lang==="fa"?"کاربران":"Users",rewards:lang==="fa"?"جوایز":"Rewards"};


STEP 2: Find this line near the end of Adm():
  {tb==="report"&&<AdminReport token={token} posts={posts} signals={signals}/>}

ADD THIS LINE AFTER IT:
  {tb==="blog"&&<AdminBlog token={token} onR={onR}/>}


STEP 3: Add the AdminBlog component function definition somewhere before the Adm() function.

That's it! You'll now have a "Blog" tab in your admin panel where you can:
- Create new articles
- Upload cover images
- Edit existing articles
- Set categories and tags
- Configure SEO meta tags
- Toggle published/draft status
- Delete articles

*/
