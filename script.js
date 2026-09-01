// ====================================================================
//  Chrome Starting Page v7.4.1 — Full Featured Dashboard
// ====================================================================

let BM={},CFG={},NOTES=[],USAGE={},TODOS=[],DDAYS=[],TRASH=[],EVENTS=[],POMO_STATS=[];
let engineIdx=0,editMode=false,editTarget=null,dragSrc=null;
let slideshowTimer=null,healthTimer=null;
let spotlightActive=-1,undoTimer=null,undoData=null,undoStack=[],calMonth=null,calYear=null,calSelectedDate=null;
let catDragSrc=null,editEventId=null;
let multiSelected=new Set(); // A6: multi-select
let saveIndicatorTimer=null; // D1: save indicator
let offlineQueue=[]; // D2: offline queue
let _persistGen={}; // Generation counter for persist race prevention
let _intervals=[]; // Track intervals for cleanup
// Tab sync: BroadcastChannel for multi-tab data synchronization
const _tabSync=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('dashboard-sync'):null;
let _tabSyncPaused=false; // Prevent echo loops

const DEFAULT_ICONS={};
const _iconCache={}; // Memory cache for resolved icon URLs

// Lazy-loading icon observer: defers favicon network requests until visible
const _iconObserver=typeof IntersectionObserver!=='undefined'?new IntersectionObserver((entries,obs)=>{
    entries.forEach(e=>{if(e.isIntersecting){obs.unobserve(e.target);const d=e.target._iconData;if(d)_resolveIconNow(d.url,e.target,d.name,d.opts)}})
},{rootMargin:'200px'}):null;

// Centralized icon resolver: 4-source fallback chain with cache + lazy loading
function resolveIcon(url,container,name,opts){
    opts=opts||{};
    const iconPath=opts.iconPath; // item.icon or DEFAULT_ICONS override
    // Cache hit or custom icon: load immediately (no network wait)
    if(iconPath||_iconCache[(() => {try{return new URL(url).hostname}catch{return''}})()]){
        _resolveIconNow(url,container,name,opts);return;
    }
    // Lazy load: defer until visible
    if(_iconObserver&&!opts.eager){
        container._iconData={url,name,opts};
        _iconObserver.observe(container);return;
    }
    _resolveIconNow(url,container,name,opts);
}
function _resolveIconNow(url,container,name,opts){
    opts=opts||{};
    const iconPath=opts.iconPath;
    if(iconPath){
        const img=document.createElement('img');img.src=iconPath;
        if(opts.style)img.style.cssText=opts.style;
        img.onload=()=>{img.classList.add('loaded')};
        img.onerror=()=>{_tryFaviconChain(url,container,name,opts)};
        container.appendChild(img);return;
    }
    _tryFaviconChain(url,container,name,opts);
}
function _tryFaviconChain(url,container,name,opts){
    try{
        const dm=new URL(url).hostname;
        // Cache hit: load immediately with fade-in
        if(_iconCache[dm]){
            const img=document.createElement('img');img.src=_iconCache[dm];
            if(opts.style)img.style.cssText=opts.style;
            img.onload=()=>{img.classList.add('loaded')};
            img.onerror=()=>makeGlass(container,name);
            container.innerHTML='';container.appendChild(img);return;
        }
        const sources=[
            `https://www.google.com/s2/favicons?sz=64&domain=${dm}`,
            `https://icons.duckduckgo.com/ip3/${dm}.ico`,
            `https://icon.horse/icon/${dm}`,
            `https://${dm}/favicon.ico`
        ];
        let idx=0;
        const img=document.createElement('img');
        if(opts.style)img.style.cssText=opts.style;
        const tryNext=()=>{idx++;if(idx>=sources.length){makeGlass(container,name);return}img.src=sources[idx]};
        img.onerror=tryNext;
        img.onload=()=>{_iconCache[dm]=sources[idx];img.classList.add('loaded')};
        img.src=sources[0];
        container.appendChild(img);
    }catch{makeGlass(container,name)}
}

// Collision-safe ID generator
let _idCounter=0;
function genId(){return Date.now()+'-'+(++_idCounter)+'-'+Math.random().toString(36).slice(2,6)}

// Safe interval tracking (for cleanup on unload)
function safeSetInterval(fn,ms){const id=setInterval(fn,ms);_intervals.push(id);return id}

const SHORTCUT_ACTIONS={
    focusSearch:()=>document.getElementById('search-input').focus(),
    toggleEdit:()=>toggleEditMode(),
    openSettings:()=>{populateSettings();openModal('modal-settings')},
    showShortcuts:()=>showShortcutToast(),
    toggleTheme:()=>toggleTheme(),
    exportData:()=>doExport(),
    spotlightSearch:()=>openSpotlight()
};

// ===== Boot =====
document.addEventListener('DOMContentLoaded',async()=>{
    const _bootStart=performance.now();
    migrateVersion(); // D3: version migration
    try{
        const[bm,nt,cf,us,td,dd,tr,ev,ps]=await Promise.all([
            fetchJ('/api/bookmarks',{}),fetchJ('/api/notes',{notes:[]}),
            fetchJ('/api/config',{}),fetchJ('/api/usage',{}),
            fetchJ('/api/todos',{items:[]}),fetchJ('/api/ddays',{items:[]}),
            fetchJ('/api/trash',{items:[]}),fetchJ('/api/events',{items:[]}),
            fetchJ('/api/pomo-stats',{sessions:[]})
        ]);
        BM=bm;NOTES=nt.notes||(Array.isArray(nt.notes)?[]:{});CFG=cf;USAGE=us;TODOS=td.items||[];DDAYS=dd.items||[];TRASH=tr.items||[];EVENTS=ev.items||[];POMO_STATS=ps.sessions||[];
    }catch{ loadOfflineCache(); } // D2: offline fallback

    // === Phase 1: Critical render (dashboard visible ASAP) ===
    applyDefaults();
    applyTheme(CFG.theme||'dark');
    applyAccent(CFG.accentColor||'blue');
    applyBlur(); // B2: blur intensity
    applyGlassPreset(); // B7: glass presets
    initAutoTheme();
    initBackground();initTimeOverlay();
    initClocks();initSearch();
    renderDDays();renderPageTabs();renderDashboard();
    document.getElementById('btn-theme')?.addEventListener('click',toggleTheme);
    initEditMode();initModals();
    applyCustomCSS();initTabTitle();
    console.log(`[Boot] Phase 1 (render) in ${Math.round(performance.now()-_bootStart)}ms`);

    // === Phase 2: Deferred init (after first paint) ===
    requestAnimationFrame(()=>{setTimeout(()=>{
        initSlideshow();initWeather();
        processRecurringTodos(); // C4: recurring todos
        initSettingsUI();initShortcuts();
        initServerHealth();initProfiles();
        initContextMenu();initSettingsSearch();initCalendarEvents();
        initDragURLDrop(); // A3: drag URL from browser
        initDragAutoScroll(); // 2026-08-20: auto-scroll while dragging bookmarks/categories
        initMultiSelect(); // A6: multi-select
        initKeyboardNav(); // D4: full keyboard nav
        initOnboarding(); // B4: onboarding
        initImportDragDrop(); // A7: drag JSON import
        initScrollRestore(); // B6: scroll position
        initFocusMode(); // C4: focus mode
        initSmartPaste(); // A3: smart paste
        initInlineEdit(); // A6: inline bookmark edit
        initEventNotifications(); // B3: event notifications
        applyLayoutPreset(); // D3: layout presets
        registerSW();
        cacheForOffline(); // D2: cache data
        validateData(); // E3: integrity check
        applyReduceMotion(); // E4: performance mode
        initTabSync(); // Multi-tab synchronization
        console.log(`[Boot] Phase 2 (deferred) in ${Math.round(performance.now()-_bootStart)}ms`);
    },0)});

    // === Phase 3: Background checks (30s delay) ===
    setTimeout(()=>{checkDeadLinks();checkWeeklyReport()},30000);

    // === PWA Shortcut Actions (from manifest.webmanifest shortcuts) ===
    const urlParams=new URLSearchParams(window.location.search);
    const action=urlParams.get('action');
    if(action==='spotlight')setTimeout(()=>openSpotlight(),500);
    if(action==='settings')setTimeout(()=>{populateSettings();openModal('modal-settings')},500);
    if(action)history.replaceState(null,'','/'); // Clean URL after handling
});

async function fetchJ(u,fb){
    try{
        const ctrl=new AbortController();const tid=setTimeout(()=>ctrl.abort(),5000);
        const r=await fetch(u,{signal:ctrl.signal});clearTimeout(tid);
        return r.ok?await r.json():fb;
    }catch(e){console.warn(`[Fetch] ${u} failed:`,e.message);return fb}
}

function applyDefaults(){
    if(!CFG.searchEngines)CFG.searchEngines=[
        {name:"Google",url:"https://www.google.com/search?q=",icon:"https://www.google.com/favicon.ico"},
        {name:"Naver",url:"https://search.naver.com/search.naver?query=",icon:"https://www.naver.com/favicon.ico"},
        {name:"YouTube",url:"https://www.youtube.com/results?search_query=",icon:"https://www.youtube.com/favicon.ico"}
    ];
    if(!CFG.clocks)CFG.clocks=[{label:"SEOUL",timezone:"Asia/Seoul"},{label:"DETROIT",timezone:"America/Detroit"}];
    if(!CFG.pages||!CFG.pages.length){
        CFG.pages=[{name:'메인',topCategories:CFG.topCategories||Object.keys(BM).slice(0,6),bottomCategories:CFG.bottomCategories||Object.keys(BM).slice(6)}];
    }
    if(CFG.activePage===undefined)CFG.activePage=0;
    if(!CFG.notepadCount)CFG.notepadCount=3;
    if(!CFG.linesPerNotepad)CFG.linesPerNotepad=6;
    // v7.1: Migrate memos to card-based model
    if(!CFG.memoCards){
        CFG.memoCards=[];
        for(let i=0;i<CFG.notepadCount;i++){CFG.memoCards.push({id:'memo_'+i,title:'메모장 '+(i+1),lines:CFG.linesPerNotepad})}
    }
    // Migrate NOTES from flat array to object if needed
    if(Array.isArray(NOTES)){
        const oldNotes=[...NOTES];const newNotes={};
        CFG.memoCards.forEach((mc,i)=>{
            const start=i*CFG.linesPerNotepad;
            newNotes[mc.id]=[];
            for(let j=0;j<mc.lines;j++){newNotes[mc.id].push(oldNotes[start+j]||'')}
        });
        NOTES=newNotes;
        fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notes:NOTES})}).catch(()=>{});
    }
    // Ensure all memo cards have entries
    CFG.memoCards.forEach(mc=>{if(!NOTES[mc.id]){NOTES[mc.id]=[];for(let j=0;j<mc.lines;j++)NOTES[mc.id].push('')}})
    // v7.1: Widget card visibility
    if(CFG.showTodo===undefined)CFG.showTodo=true;
    if(CFG.showCalendar===undefined)CFG.showCalendar=true;
    if(CFG.showHabit===undefined)CFG.showHabit=true;
    // v7.2: Multiple todo cards
    if(!CFG.todoCards){CFG.todoCards=[{id:'todo_0',title:'할 일'}]}
    // Migrate existing todos: add cardId if missing
    TODOS.forEach(t=>{if(!t.cardId)t.cardId='todo_0'});
    if(!CFG.shortcuts)CFG.shortcuts=[
        {key:"/",action:"focusSearch",label:"검색"},{key:"e",action:"toggleEdit",label:"편집 모드"},
        {key:"s",action:"openSettings",label:"설정"},{key:"?",action:"showShortcuts",label:"단축키 보기"},
        {key:"f",action:"spotlightSearch",label:"북마크 검색"}
    ];
    if(!CFG.collapsedCategories)CFG.collapsedCategories=[];
    if(!CFG.cardSizes)CFG.cardSizes={};
    if(!CFG.slideshow)CFG.slideshow={enabled:false,images:[],intervalMinutes:10};
    // v7.3: Unified background system
    if(!CFG.backgrounds)CFG.backgrounds=[];
    if(CFG.bgIntervalMinutes===undefined)CFG.bgIntervalMinutes=10;
    if(CFG.slideshowEnabled===undefined)CFG.slideshowEnabled=true; // Default ON for 2+ images (backward compat)
    // Migrate: old single backgroundImage + slideshow → unified backgrounds[]
    if(CFG.backgroundImage&&CFG.backgroundImage!=='assets/background.png'&&!CFG._bgMigrated){
        if(!CFG.backgrounds.includes(CFG.backgroundImage))CFG.backgrounds.unshift(CFG.backgroundImage);
    }
    if(CFG.slideshow?.images?.length&&!CFG._bgMigrated){
        CFG.slideshow.images.forEach(img=>{if(!CFG.backgrounds.includes(img))CFG.backgrounds.push(img)});
        if(CFG.slideshow.intervalMinutes)CFG.bgIntervalMinutes=CFG.slideshow.intervalMinutes;
    }
    if(!CFG._bgMigrated){CFG._bgMigrated=true}
    if(CFG.usageTracking===undefined)CFG.usageTracking=true;
    if(CFG.showRecommendations===undefined)CFG.showRecommendations=false;
    if(CFG.backgroundOverlayOpacity===undefined)CFG.backgroundOverlayOpacity=15;
    if(CFG.timeBasedOverlay===undefined)CFG.timeBasedOverlay=true;
    if(CFG.backupIntervalHours===undefined)CFG.backupIntervalHours=24;
    if(!CFG.customCSS)CFG.customCSS='';
    if(!CFG.themeMode)CFG.themeMode='manual';
    if(!CFG.cardColors)CFG.cardColors={};
    if(CFG.calendarStartMonday===undefined)CFG.calendarStartMonday=true;
    if(!CFG.accentColor)CFG.accentColor='blue';
    if(!CFG.lastEventColor)CFG.lastEventColor='#6ea8fe';
    if(CFG.blurIntensity===undefined)CFG.blurIntensity=18; // B2
    if(!CFG.glassPreset)CFG.glassPreset='normal'; // B7
    if(CFG.cardOpacity===undefined)CFG.cardOpacity=50;
    if(CFG.clockOpacity===undefined)CFG.clockOpacity=22;
    if(CFG.autoSortByUsage===undefined)CFG.autoSortByUsage=false; // A5
    if(CFG.onboardingDone===undefined)CFG.onboardingDone=false; // B4
    if(!CFG.todoTags)CFG.todoTags=['업무','개인','긴급','아이디어']; // C6
    if(CFG._version===undefined)CFG._version=53; // D3
    // v6.0 features
    if(!CFG.catEmojis)CFG.catEmojis={}; // B1: category emoji
    if(CFG.listView===undefined)CFG.listView=false; // B2: list view
    if(!CFG.focusCategory)CFG.focusCategory=''; // C4: focus mode
    if(!CFG.bookmarkGroups)CFG.bookmarkGroups=[]; // C3: bookmark groups
    if(CFG.calWeeklyView===undefined)CFG.calWeeklyView=false; // B3: weekly view
    if(CFG.reduceMotion===undefined)CFG.reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false; // E4
    if(!CFG.todoCompletionDates)CFG.todoCompletionDates=[]; // D2: streak
    if(!CFG.deadLinks)CFG.deadLinks={}; // A2: dead link map
    if(!CFG._deadLinkFails)CFG._deadLinkFails={}; // A2: persistent fail counter
    if(!CFG.weeklyReportDate)CFG.weeklyReportDate=''; // D1
    if(CFG._version<60)CFG._version=60;
    // v7.0 features
    if(!CFG.habits)CFG.habits=[]; // E2: habit tracker
    if(!CFG.habitLog)CFG.habitLog={}; // E2: habit log
    if(!CFG.layoutPreset)CFG.layoutPreset='default'; // D3: layout presets
    if(CFG.pomoAutoSession===undefined)CFG.pomoAutoSession=false; // E5: auto pomo
    if(CFG.pomoSessionCount===undefined)CFG.pomoSessionCount=0; // E5
    if(!CFG.searchKeywords)CFG.searchKeywords={yt:'https://www.youtube.com/results?search_query=',nv:'https://search.naver.com/search.naver?query=',gh:'https://github.com/search?q=',g:'https://www.google.com/search?q=',tw:'https://twitter.com/search?q=',map:'https://maps.google.com/maps?q='}; // F3
    if(CFG.eventNotifications===undefined)CFG.eventNotifications=true; // B3
    if(CFG._version<70)CFG._version=70;

    // ===== DATA INTEGRITY VALIDATION =====
    // Remove corrupted todos (missing required fields)
    TODOS=TODOS.filter(t=>t&&typeof t.text==='string'&&t.id);
    TODOS.forEach(t=>{
        if(typeof t.done!=='boolean')t.done=false;
        if(typeof t.priority!=='number'||t.priority<0||t.priority>3)t.priority=0;
        if(!Array.isArray(t.tags))t.tags=[];
        if(!Array.isArray(t.subtasks))t.subtasks=[];
        if(typeof t.cardId!=='string')t.cardId=CFG.todoCards[0]?.id||'todo_0';
    });
    // Remove corrupted events
    EVENTS=EVENTS.filter(e=>e&&e.id&&e.title&&e.date);
    // Remove corrupted bookmarks (empty arrays OK, invalid entries filtered)
    Object.keys(BM).forEach(cat=>{
        if(!Array.isArray(BM[cat])){BM[cat]=[];return}
        BM[cat]=BM[cat].filter(b=>b&&b.name&&b.url);
    });
    // Ensure page references valid categories
    CFG.pages.forEach(p=>{
        p.topCategories=(p.topCategories||[]).filter(c=>BM[c]);
        p.bottomCategories=(p.bottomCategories||[]).filter(c=>BM[c]);
    });
    // Trim old completion dates (keep last 90 days)
    if(CFG.todoCompletionDates?.length>90){CFG.todoCompletionDates=CFG.todoCompletionDates.slice(-90)}

    // v7.3: Migrate usage keys from "cat::name" to URL-based
    if(!CFG._usageMigratedToUrl){
        const allBM=[];Object.entries(BM).forEach(([cat,items])=>{if(Array.isArray(items))items.forEach(b=>allBM.push({cat,name:b.name,url:b.url}))});
        // Build lookup maps for flexible matching
        const byName={};const byHost={};
        allBM.forEach(b=>{
            byName[b.name]=b;
            try{byHost[new URL(b.url).hostname.replace('www.','')]=b}catch{}
        });
        const newUsage={};let migrated=0,dropped=0;
        Object.entries(USAGE).forEach(([key,val])=>{
            // Already URL-based? keep as-is
            if(key.startsWith('http://')||key.startsWith('https://')){newUsage[key]=val;return}
            // Old format: "cat::name"
            const sep=key.indexOf('::');
            if(sep===-1)return;
            const oldName=key.slice(sep+2);
            // Try matching: 1) exact name → 2) hostname → 3) name contains hostname → 4) partial match
            let match=byName[oldName]
                ||byHost[oldName.toLowerCase().replace('www.','')]
                ||allBM.find(b=>{try{return new URL(b.url).hostname.replace('www.','').includes(oldName.toLowerCase().replace('www.',''))}catch{return false}})
                ||allBM.find(b=>b.name.toLowerCase().includes(oldName.toLowerCase())||oldName.toLowerCase().includes(b.name.toLowerCase()));
            if(match&&match.url){
                const existing=newUsage[match.url];
                if(existing){existing.count=(existing.count||0)+(val.count||0);if(val.lastUsed>existing.lastUsed)existing.lastUsed=val.lastUsed}
                else{newUsage[match.url]=val}
                migrated++;
            }else{dropped++}
        });
        USAGE=newUsage;
        CFG._usageMigratedToUrl=true;
        fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(USAGE)}).catch(()=>{});
        persistConfig();
        console.log(`[Migration] Usage keys: ${migrated} migrated, ${dropped} unmatched (deleted bookmarks)`);
    }
}

function curPage(){return CFG.pages[CFG.activePage]||CFG.pages[0]||{name:'메인',topCategories:[],bottomCategories:[]};}

// ====================================================================
//  THEME + OS Auto
// ====================================================================
function applyTheme(t){
    document.documentElement.setAttribute('data-theme',t);CFG.theme=t;
    const dk=document.getElementById('icon-theme-dark'),lt=document.getElementById('icon-theme-light');
    if(dk&&lt){dk.style.display=t==='dark'?'block':'none';lt.style.display=t==='light'?'block':'none'}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',t==='dark'?'#0c0e12':'#e8eaee');
    applyOpacitySettings();
}
function applyAccent(c){document.documentElement.setAttribute('data-accent',c||'blue');CFG.accentColor=c}
// B2: Blur intensity
function applyBlur(){document.documentElement.style.setProperty('--blur',(CFG.blurIntensity||18)+'px')}
// B7: Glass presets
function applyGlassPreset(){
    const p=CFG.glassPreset||'normal';document.documentElement.setAttribute('data-glass',p);
    applyOpacitySettings();
}
function applyOpacitySettings(){
    const root=document.documentElement;
    const co=CFG.cardOpacity??50;
    const ck=CFG.clockOpacity??22;
    const isDark=CFG.theme!=='light';
    if(isDark){
        const a=co/100;
        root.style.setProperty('--glass-surface',`rgba(255,255,255,${(a*0.35).toFixed(3)})`);
        root.style.setProperty('--glass-surface-hover',`rgba(255,255,255,${(a*0.35+0.04).toFixed(3)})`);
        root.style.setProperty('--clock-bg',`rgba(0,0,0,${(ck/100*0.85).toFixed(3)})`);
    } else {
        const a=co/100;
        root.style.setProperty('--glass-surface',`rgba(255,255,255,${(0.1+a*0.85).toFixed(3)})`);
        root.style.setProperty('--glass-surface-hover',`rgba(255,255,255,${(0.15+a*0.85).toFixed(3)})`);
        root.style.setProperty('--clock-bg',`rgba(255,255,255,${(ck/100*0.85).toFixed(3)})`);
    }
}
// B5: Theme circle transition
function toggleTheme(){
    if(CFG.themeMode==='auto')return;
    const next=CFG.theme==='dark'?'light':'dark';
    const btn=document.getElementById('btn-theme');
    if(btn&&document.startViewTransition){
        const rect=btn.getBoundingClientRect();
        const x=rect.left+rect.width/2;const y=rect.top+rect.height/2;
        const r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
        document.documentElement.style.setProperty('--tx',x+'px');
        document.documentElement.style.setProperty('--ty',y+'px');
        document.documentElement.style.setProperty('--tr',r+'px');
        const t=document.startViewTransition(()=>applyTheme(next));
        t.ready.then(()=>{document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:500,easing:'ease-out',pseudoElement:'::view-transition-new(root)'})}).catch(()=>{});
    } else { applyTheme(next); }
    persistConfig();
}
let _autoThemeHandler=null;
function initAutoTheme(){
    const mq=window.matchMedia('(prefers-color-scheme:dark)');
    // Remove previous listener to prevent accumulation
    if(_autoThemeHandler){mq.removeEventListener('change',_autoThemeHandler);_autoThemeHandler=null}
    if(CFG.themeMode==='auto'){
        applyTheme(mq.matches?'dark':'light');
        _autoThemeHandler=e=>{if(CFG.themeMode==='auto')applyTheme(e.matches?'dark':'light')};
        mq.addEventListener('change',_autoThemeHandler);
    }
}
// btn-theme listener registered in initSettingsUI (no duplicate needed)

// ====================================================================
//  TAB TITLE WITH TIME
// ====================================================================
function initTabTitle(){updateTabTitle();safeSetInterval(updateTabTitle,10000)}
function updateTabTitle(){const now=new Date();const t=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});document.title=t+' | Dashboard'}

// ====================================================================
//  BACKGROUND & TIME OVERLAY & SLIDESHOW
// ====================================================================
function initBackground(){
    const img=document.getElementById('bg-image'),ov=document.getElementById('bg-overlay');
    const bgs=CFG.backgrounds||[];
    if(bgs.length){
        // Show first background (no cache-bust for fixed backgrounds)
        img.src=bgs[0];
    } else if(CFG.backgroundImage){
        img.src=CFG.backgroundImage;
    }
    ov.style.background=`rgba(0,0,0,${(CFG.backgroundOverlayOpacity||15)/100})`;
    // Auto-rotation: 2+ images → start slideshow automatically
    initSlideshow();
}
function initTimeOverlay(){updateTimeOverlay();safeSetInterval(updateTimeOverlay,60000)}
function updateTimeOverlay(){
    const el=document.getElementById('time-overlay');
    if(!CFG.timeBasedOverlay){el.classList.remove('active');return}
    const h=new Date().getHours();let c;
    if(h>=5&&h<7)c='rgba(60,80,140,0.25)';else if(h>=7&&h<12)c='rgba(255,220,150,0.12)';
    else if(h>=12&&h<17)c='rgba(255,240,200,0.08)';else if(h>=17&&h<20)c='rgba(255,140,60,0.18)';
    else if(h>=20&&h<22)c='rgba(80,50,120,0.22)';else c='rgba(15,20,50,0.30)';
    el.style.background=c;el.classList.add('active');
}
let _bgIdx=0;
function initSlideshow(){
    if(slideshowTimer)clearInterval(slideshowTimer);slideshowTimer=null;
    const bgs=CFG.backgrounds||[];
    // 0-1 images: fixed, no rotation possible
    if(bgs.length<2)return;
    // 2+ images but slideshow disabled: stay on current image
    if(!CFG.slideshowEnabled)return;
    // 2+ images + slideshow enabled: auto-rotate
    const interval=(CFG.bgIntervalMinutes||10)*60000;
    slideshowTimer=safeSetInterval(()=>{
        _bgIdx=(_bgIdx+1)%bgs.length;
        slideshowTransition(bgs[_bgIdx]);
    },interval);
}
function slideshowTransition(src){
    const bg=document.getElementById('bg-image');
    bg.style.opacity='0';
    setTimeout(()=>{bg.src=src;bg.style.opacity='1'},600);
}
function slideshowGoTo(idx){
    const bgs=CFG.backgrounds||[];
    if(!bgs.length)return;
    _bgIdx=((idx%bgs.length)+bgs.length)%bgs.length; // Wrap around
    slideshowTransition(bgs[_bgIdx]);
    updateBgCurrentIdx();
}
function updateBgCurrentIdx(){
    const el=document.getElementById('bg-current-idx');
    if(el)el.textContent=`${_bgIdx+1}/${(CFG.backgrounds||[]).length}`;
}
function sanitizeCSS(css){
    if(!css)return'';
    // Remove dangerous CSS patterns that can execute JavaScript or load external resources
    return css
        .replace(/expression\s*\(/gi,'/* blocked */(')
        .replace(/url\s*\(\s*(['"]?)javascript:/gi,'url($1blocked:')
        .replace(/@import\s+url\s*\(\s*(['"]?)https?:/gi,'/* blocked-import */url($1blocked:')
        .replace(/behavior\s*:/gi,'/* blocked */blocked:')
        .replace(/-moz-binding\s*:/gi,'/* blocked */blocked:');
}
function applyCustomCSS(){let el=document.getElementById('custom-style-inject');if(!el){el=document.createElement('style');el.id='custom-style-inject';document.head.appendChild(el)}el.textContent=sanitizeCSS(CFG.customCSS||'')}
// ====================================================================
async function initWeather(){
    if(!CFG.weatherApiKey){document.getElementById('weather-widget').style.display='none';return}
    try{
        const city=CFG.weatherCity||'Seoul',units=CFG.weatherUnits||'metric';
        const r=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${CFG.weatherApiKey}`);
        if(!r.ok)return;const d=await r.json();
        const iconMap={'01':'☀️','02':'⛅','03':'☁️','04':'☁️','09':'🌧️','10':'🌦️','11':'⛈️','13':'🌨️','50':'🌫️'};
        const ic=d.weather[0]?.icon?.slice(0,2)||'01';
        document.getElementById('weather-icon').textContent=iconMap[ic]||'☀️';
        document.getElementById('weather-temp').textContent=Math.round(d.main.temp)+(units==='imperial'?'°F':'°C');
        document.getElementById('weather-city').textContent=d.name;
        document.getElementById('weather-widget').style.display='flex';
    }catch{document.getElementById('weather-widget').style.display='none'}
}

// ====================================================================
//  CLOCKS
// ====================================================================
function initClocks(){renderClocks();updateClocks();safeSetInterval(updateClocks,1000)}
function renderClocks(){const c=document.getElementById('clock-container');c.innerHTML='';(CFG.clocks||[]).forEach(ck=>{const d=document.createElement('div');d.className='clock-item';d.innerHTML=`<span class="clock-label">${esc(ck.label)}</span><span class="clock-time" data-tz="${esc(ck.timezone)}">--:--</span>`;c.appendChild(d)})}
function updateClocks(){document.querySelectorAll('.clock-time[data-tz]').forEach(el=>{try{el.textContent=new Date().toLocaleTimeString('en-GB',{timeZone:el.dataset.tz,hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{el.textContent='--:--'}})}

// ====================================================================
//  D-DAY
// ====================================================================
function renderDDays(){
    const bar=document.getElementById('dday-bar');bar.innerHTML='';
    const sorted=[...DDAYS].sort((a,b)=>{
        const da=Math.abs(Math.ceil((new Date(a.date)-new Date().setHours(0,0,0,0))/(864e5)));
        const db=Math.abs(Math.ceil((new Date(b.date)-new Date().setHours(0,0,0,0))/(864e5)));
        return da-db;
    });
    sorted.forEach(dd=>{const diff=Math.ceil((new Date(dd.date)-new Date().setHours(0,0,0,0))/(864e5));
        const chip=document.createElement('div');chip.className='dday-chip'+(diff<0?' past':'')+(diff>=0&&diff<=3?' urgent':'')+(diff===0?' today':'');
        const dateStr=(dd.date||'').slice(5).replace('-','/');
        chip.innerHTML=`<span class="dday-label">${esc(dd.label)}</span><span class="dday-date">${esc(dateStr)}</span><span class="dday-num">${diff===0?'D-Day':diff>0?'D-'+diff:'D+'+Math.abs(diff)}</span>`;
        bar.appendChild(chip)});
}

// ====================================================================
//  SEARCH
// ====================================================================
function initSearch(){
    const toggle=document.getElementById('search-toggle'),icon=document.getElementById('search-icon'),input=document.getElementById('search-input');
    const container=toggle.closest('.search-container');
    const engines=CFG.searchEngines;
    const update=()=>{const e=engines[engineIdx];if(!e)return;icon.src=e.icon;input.placeholder=`${e.name} 검색... (단축키: yt, nv, gh, g, tw, map)`;}
    update();
    // Keyword tooltip on focus
    let kwTip=document.getElementById('kw-tooltip');
    if(!kwTip){kwTip=document.createElement('div');kwTip.id='kw-tooltip';kwTip.className='kw-tooltip';container.style.position='relative';container.appendChild(kwTip)}
    function buildKwTip(){const kws=Object.entries(CFG.searchKeywords||{});if(!kws.length)return'';return kws.map(([k,v])=>{try{return`<span class="kw-item"><b>${k}</b> ${new URL(v).hostname.replace('www.','')}</span>`}catch{return''}}).join('')}
    input.addEventListener('focus',()=>{const html=buildKwTip();if(html){kwTip.innerHTML=html;kwTip.classList.add('show')}});
    input.addEventListener('blur',()=>{setTimeout(()=>kwTip.classList.remove('show'),200)});
    input.addEventListener('input',()=>{const v=input.value.trim().split(/\s+/)[0]?.toLowerCase();if(v&&CFG.searchKeywords[v]){kwTip.classList.remove('show')}else if(document.activeElement===input){kwTip.classList.add('show')}});
    // Engine dropdown
    let dropdown=document.getElementById('engine-dropdown');
    if(!dropdown){dropdown=document.createElement('div');dropdown.id='engine-dropdown';dropdown.className='engine-dropdown';container.style.position='relative';container.appendChild(dropdown)}
    function buildDropdown(){
        dropdown.innerHTML='';
        engines.forEach((en,i)=>{
            const item=document.createElement('button');item.className='engine-dd-item'+(i===engineIdx?' active':'');
            item.innerHTML=`<img src="${esc(en.icon)}" class="engine-dd-icon"><span class="engine-dd-name">${esc(en.name)}</span>`;
            const ddImg=item.querySelector('.engine-dd-icon');if(ddImg)ddImg.addEventListener('error',()=>{ddImg.style.display='none'});
            item.addEventListener('click',e=>{e.stopPropagation();engineIdx=i;update();closeDropdown();input.focus()});
            dropdown.appendChild(item);
        });
    }
    function openDropdown(){buildDropdown();dropdown.classList.add('open')}
    function closeDropdown(){dropdown.classList.remove('open')}
    toggle.addEventListener('click',e=>{e.stopPropagation();dropdown.classList.contains('open')?closeDropdown():openDropdown()});
    document.addEventListener('click',e=>{if(!dropdown.contains(e.target)&&e.target!==toggle&&!toggle.contains(e.target))closeDropdown()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=input.value.trim();if(!q)return;
        // F3: Keyword shortcuts (e.g., "yt cats" → YouTube search for "cats")
        const parts=q.split(/\s+/);const prefix=parts[0].toLowerCase();
        if(CFG.searchKeywords[prefix]&&parts.length>1){const searchQ=parts.slice(1).join(' ');window.location.href=CFG.searchKeywords[prefix]+encodeURIComponent(searchQ);return}
        window.location.href=engines[engineIdx].url+encodeURIComponent(q)}});
}

// ====================================================================
//  PAGE TABS
// ====================================================================
function renderPageTabs(){
    const c=document.getElementById('page-tabs');c.innerHTML='';
    if(CFG.pages.length<=1&&!editMode){c.style.display='none';return}
    c.style.display='flex';
    CFG.pages.forEach((p,i)=>{
        const tab=document.createElement('button');tab.className='page-tab'+(i===CFG.activePage?' active':'');
        tab.textContent=p.name;
        // Click to switch page
        tab.addEventListener('click',()=>{CFG.activePage=i;persistConfig();renderPageTabs();renderDashboard()});
        // Drag-over: highlight tab as drop target for cards/bookmarks
        tab.addEventListener('dragover',e=>{
            if(i===CFG.activePage)return; // Can't drop on current page
            e.preventDefault();tab.classList.add('page-tab-drop');
        });
        tab.addEventListener('dragleave',()=>tab.classList.remove('page-tab-drop'));
        // Drop: move dragged category card or bookmark to this page
        tab.addEventListener('drop',e=>{
            tab.classList.remove('page-tab-drop');
            if(i===CFG.activePage)return;
            e.preventDefault();e.stopPropagation();
            // Case 1: Category card drag (catDragSrc is set)
            if(catDragSrc){
                let srcPageIdx=-1;
                CFG.pages.forEach((pg,pi)=>{if([...(pg.topCategories||[]),...(pg.bottomCategories||[])].includes(catDragSrc))srcPageIdx=pi});
                if(srcPageIdx!==-1&&srcPageIdx!==i){moveCatToPage(catDragSrc,srcPageIdx,i)}
                catDragSrc=null;return;
            }
            // Case 2: Bookmark drag (dragSrc is set)
            if(dragSrc){
                const bItem=BM[dragSrc.cat]?.[dragSrc.idx];
                if(!bItem)return;
                // Show category picker for the target page
                showMoveToPageCategoryPicker(bItem,dragSrc.cat,dragSrc.idx,i);
                dragSrc=null;return;
            }
        });
        c.appendChild(tab);
    });
}
// Show category picker when dropping a bookmark on a page tab
function showMoveToPageCategoryPicker(bItem,srcCat,srcIdx,targetPageIdx){
    const existing=document.querySelector('.move-page-popup');if(existing)existing.remove();
    const targetPage=CFG.pages[targetPageIdx];
    const cats=[...(targetPage.topCategories||[]),...(targetPage.bottomCategories||[])];
    if(!cats.length){showUndo(`"${targetPage.name}" 페이지에 카테고리가 없습니다`,null);return}
    const popup=document.createElement('div');popup.className='move-page-popup move-bm-popup';
    popup.innerHTML=`<div class="mpp-title">"${esc(bItem.name)}" → ${esc(targetPage.name)}</div>`;
    cats.forEach(c=>{
        const btn=document.createElement('button');btn.className='mpp-btn';btn.textContent=c;
        btn.addEventListener('click',()=>{
            const backup={item:JSON.parse(JSON.stringify(bItem)),cat:srcCat,idx:srcIdx};
            BM[srcCat].splice(srcIdx,1);
            if(!BM[c])BM[c]=[];
            BM[c].push(bItem);
            persistBM();renderDashboard();popup.remove();
            showUndo(`"${bItem.name}" → "${c}" (${targetPage.name}) 이동됨`,()=>{
                BM[c]=BM[c].filter(b=>b!==bItem);
                BM[backup.cat].splice(backup.idx,0,backup.item);
                persistBM();renderDashboard();
            });
        });
        popup.appendChild(btn);
    });
    document.body.appendChild(popup);
    popup.style.position='fixed';popup.style.left='50%';popup.style.top='50%';popup.style.transform='translate(-50%,-50%)';
    setTimeout(()=>document.addEventListener('click',e=>{if(!popup.contains(e.target))popup.remove()},{once:true}),10);
}
// 2026-08-20 신설 — showMoveToPageCategoryPicker(다른 페이지로 옮길 때)와 동일한 UI
// 패턴을, 더 흔한 "같은 페이지 안에서 다른 카테고리로 옮기기"에도 그대로 적용한다
// (사용성 감사: 앱이 이미 만들어둔 더 편한 방식을 정작 흔한 케이스엔 안 쓰던 비일관성).
function showMoveWithinPageCategoryPicker(bItem,srcCat,srcIdx){
    const existing=document.querySelector('.move-page-popup');if(existing)existing.remove();
    const page=CFG.pages[CFG.activePage];
    const cats=[...(page.topCategories||[]),...(page.bottomCategories||[])].filter(c=>c!==srcCat&&BM[c]!==undefined);
    if(!cats.length){showUndo('이 페이지에 옮길 수 있는 다른 카테고리가 없습니다',null);return}
    const popup=document.createElement('div');popup.className='move-page-popup move-bm-popup';
    popup.innerHTML=`<div class="mpp-title">"${esc(bItem.name)}" 이동</div>`;
    cats.forEach(c=>{
        const btn=document.createElement('button');btn.className='mpp-btn';btn.textContent=c;
        btn.addEventListener('click',()=>{
            const backup={item:JSON.parse(JSON.stringify(bItem)),cat:srcCat,idx:srcIdx};
            BM[srcCat].splice(srcIdx,1);
            if(!BM[c])BM[c]=[];
            BM[c].push(bItem);
            persistBM();renderDashboard();popup.remove();
            showUndo(`"${bItem.name}" → "${c}" 이동됨`,()=>{
                BM[c]=BM[c].filter(b=>b!==bItem);
                BM[backup.cat].splice(backup.idx,0,backup.item);
                persistBM();renderDashboard();
            });
        });
        popup.appendChild(btn);
    });
    document.body.appendChild(popup);
    popup.style.position='fixed';popup.style.left='50%';popup.style.top='50%';popup.style.transform='translate(-50%,-50%)';
    setTimeout(()=>document.addEventListener('click',e=>{if(!popup.contains(e.target))popup.remove()},{once:true}),10);
}

// ====================================================================
//  DASHBOARD RENDER
// ====================================================================
function renderDashboard(){
    // Preserve focus state
    const ae=document.activeElement;
    let _focusRestore=null;
    if(ae&&(ae.classList.contains('todo-add-input')||ae.classList.contains('todo-text')||ae.classList.contains('bm-qa-input'))){
        const card=ae.closest('.card-common');
        const cardTitle=card?.querySelector('.card-title-text')?.textContent;
        _focusRestore={cls:ae.className.split(' ')[0],cardTitle,selStart:ae.selectionStart,selEnd:ae.selectionEnd,val:ae.value};
    }
    const page=curPage();
    const top=document.getElementById('grid-top'),bot=document.getElementById('grid-bottom');
    top.innerHTML='';bot.innerHTML='';let delay=0;
    (page.topCategories||[]).forEach(cat=>{if(!BM[cat])return;
        const card=createFolderCard(cat);const _cs=parseInt(CFG.cardSizes[cat])||1;if(_cs>=2)card.classList.add('card-span-'+_cs);
        card.style.animationDelay=`${delay*35}ms`;top.appendChild(card);delay++});
    top.appendChild(createAddCardPlaceholder('top'));

    (page.bottomCategories||[]).forEach(cat=>{if(!BM[cat])return;
        const card=createFolderCard(cat);card.classList.add('card-tall');
        const _csb=parseInt(CFG.cardSizes[cat])||1;if(_csb>=2)card.classList.add('card-span-'+_csb);
        card.style.animationDelay=`${delay*35}ms`;bot.appendChild(card);delay++});

    // Notepads (dynamic)
    CFG.memoCards.forEach(mc=>{
        if(!NOTES[mc.id]){NOTES[mc.id]=[];for(let j=0;j<mc.lines;j++)NOTES[mc.id].push('')}
        const np=createNotepadCard(mc);np.classList.add('card-tall');np.style.animationDelay=`${delay*35}ms`;bot.appendChild(np);delay++
    });

    // Todo (dynamic)
    if(CFG.showTodo){CFG.todoCards.forEach(tc=>{const todo=createTodoCard(tc);todo.classList.add('card-tall');todo.style.animationDelay=`${delay*35}ms`;bot.appendChild(todo);delay++})}

    // Calendar
    if(CFG.showCalendar){const cal=createCalendarCard();cal.classList.add('card-tall');cal.style.animationDelay=`${delay*35}ms`;bot.appendChild(cal);delay++}

    // Pomodoro
    {const pomo=createPomodoroCard();pomo.classList.add('card-tall');pomo.style.animationDelay=`${delay*35}ms`;bot.appendChild(pomo);delay++}

    // E2: Habit tracker
    if(CFG.showHabit&&CFG.habits.length){const hab=createHabitCard();hab.classList.add('card-tall');hab.style.animationDelay=`${delay*35}ms`;bot.appendChild(hab);delay++}

    bot.appendChild(createAddCardPlaceholder('bottom'));

    requestAnimationFrame(()=>{document.querySelectorAll('.card-common').forEach(c=>c.classList.add('animate-rise'))});
    setupNotepads();
    // D1: Card gradients
    applyCardGradients();
    // D2: Micro-interactions (ripple on bookmark click)
    if(!CFG.reduceMotion){document.querySelectorAll('.bookmark-item').forEach(el=>el.addEventListener('click',addRipple))}
    // Restore focus
    if(_focusRestore){requestAnimationFrame(()=>{
        const cards=document.querySelectorAll('.card-common');
        for(const c of cards){if(c.querySelector('.card-title-text')?.textContent===_focusRestore.cardTitle){
            const inp=c.querySelector('.'+_focusRestore.cls);
            if(inp){inp.focus();try{inp.setSelectionRange(_focusRestore.selStart,_focusRestore.selEnd)}catch{}}break}}
    })}
}

// ====================================================================
//  FOLDER CARD
// ====================================================================
function createFolderCard(cat){
    const card=document.createElement('div');card.className='card-common folder';card.dataset.category=cat;
    if(CFG.cardColors[cat]){card.setAttribute('data-color','1');card.style.setProperty('--card-custom-color',CFG.cardColors[cat])}
    if(CFG.collapsedCategories.includes(cat))card.classList.add('collapsed');

    const title=document.createElement('div');title.className='card-title';
    title.innerHTML=`
        <span class="cat-drag-handle" draggable="true" title="드래그로 순서 변경">⠿</span>
        <span class="collapse-arrow">▼</span>
        <span class="card-title-text">${esc(cat)}</span>
        <div class="card-title-btns">
            <div class="card-edit-btns">
                <button class="cat-rename-btn" title="이름 변경" data-action="rename-cat" data-cat="${esc(cat)}">✎</button>
                <button class="card-edit-btn" title="페이지 이동" data-action="move-cat-page" data-cat="${esc(cat)}">📄</button>
                <button class="card-edit-btn resize-btn" title="칸 수 변경 (${parseInt(CFG.cardSizes[cat])||1}칸)" data-action="resize" data-cat="${esc(cat)}">${parseInt(CFG.cardSizes[cat])||1}칸</button>
                <button class="card-edit-btn" title="추가" data-action="add-bm" data-cat="${esc(cat)}">+</button>
                <button class="card-edit-btn danger" title="삭제" data-action="del-cat" data-cat="${esc(cat)}">×</button>
            </div>
        </div>`;
    card.appendChild(title);

    // Category drag
    const handle=title.querySelector('.cat-drag-handle');
    handle.addEventListener('dragstart',e=>{catDragSrc=cat;card.classList.add('cat-dragging');e.dataTransfer.effectAllowed='move'});
    handle.addEventListener('dragend',()=>{card.classList.remove('cat-dragging');catDragSrc=null});
    card.addEventListener('dragover',e=>{if(!catDragSrc||catDragSrc===cat)return;e.preventDefault();card.classList.add('drag-over-card')});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over-card'));
    card.addEventListener('drop',e=>{
        card.classList.remove('drag-over-card');
        if(!catDragSrc||catDragSrc===cat)return;e.preventDefault();e.stopPropagation();
        const page=curPage();
        const moveCatInArr=(arr)=>{const fi=arr.indexOf(catDragSrc),ti=arr.indexOf(cat);if(fi===-1)return false;arr.splice(fi,1);const ni=arr.indexOf(cat);arr.splice(ni,0,catDragSrc);return true};
        if(!moveCatInArr(page.topCategories||[]))moveCatInArr(page.bottomCategories||[]);
        catDragSrc=null;persistConfig();renderDashboard();
    });

    // Collapse
    title.addEventListener('click',e=>{
        if(e.target.closest('.card-edit-btns')||e.target.closest('.cat-drag-handle')||e.target.closest('.cat-rename-btn'))return;
        card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(cat))CFG.collapsedCategories.push(cat)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==cat)}
        persistConfig()});


    // Drop bookmark on card
    card.addEventListener('dragover',e=>{if(!dragSrc||catDragSrc)return;e.preventDefault();card.classList.add('drag-over-card')});
    card.addEventListener('drop',e=>{
        if(catDragSrc)return;e.preventDefault();e.stopPropagation();card.classList.remove('drag-over-card');
        if(!dragSrc||dragSrc.cat===cat)return;
        const item=BM[dragSrc.cat].splice(dragSrc.idx,1)[0];BM[cat].push(item);dragSrc=null;persistBM();renderDashboard()});

    const list=document.createElement('div');list.className='bookmark-list'+(CFG.listView?' list-view':'');list.dataset.category=cat;
    // A5: Auto-sort by usage
    let items=[...(BM[cat]||[])];
    if(CFG.autoSortByUsage){items.sort((a,b)=>{const ua=USAGE[a.url]?.count||0;const ub=USAGE[b.url]?.count||0;return ub-ua})}
    // A1: Time-based sort boost
    const hour=new Date().getHours();
    if(CFG.usageTracking){items.sort((a,b)=>{
        const ha=USAGE[a.url]?.hourly?.[hour]||0,hb=USAGE[b.url]?.hourly?.[hour]||0;return hb-ha})}
    // Pin: pinned bookmarks always on top (stable sort preserves order within pinned/unpinned groups)
    items.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
    items.forEach((item,idx)=>list.appendChild(createBookmarkEl(cat,item,idx)));
    if(!items.length){const empty=document.createElement('div');empty.className='empty-state';empty.innerHTML='<span class="empty-state-icon">📂</span><span>URL을 아래에 붙여넣거나<br>브라우저에서 드래그하세요</span>';list.appendChild(empty)}

    // B5: Collapsed preview (show first 4 icons when collapsed)
    const preview=document.createElement('div');preview.className='collapsed-preview';
    items.slice(0,4).forEach(item=>{
        const ic=document.createElement('div');ic.className='preview-icon';
        resolveIcon(item.url,ic,item.name,{iconPath:item.icon||DEFAULT_ICONS[item.name]});
        preview.appendChild(ic);
    });
    if(items.length>4){const more=document.createElement('span');more.className='preview-more';more.textContent=`+${items.length-4}`;preview.appendChild(more)}
    card.appendChild(preview);

    // Tab history recommendations
    if(CFG.usageTracking&&CFG.showRecommendations){
        const recs=getRecommendations(cat);
        if(recs.length){
            const sec=document.createElement('div');sec.className='rec-section';
            sec.innerHTML='<div class="rec-label">자주 사용</div>';
            recs.forEach(r=>{const el=createBookmarkEl(r.category,r,0);el.classList.add('frequent');sec.appendChild(el)});
            list.appendChild(sec);
        }
    }

    // INLINE QUICK-ADD: type URL or name directly in card
    const quickAdd=document.createElement('div');quickAdd.className='bm-quick-add';
    const qaInput=document.createElement('input');qaInput.type='text';qaInput.className='bm-qa-input';
    qaInput.placeholder='+ URL 또는 이름 입력...';qaInput.autocomplete='off';
    qaInput.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
            e.preventDefault();const val=qaInput.value.trim();if(!val)return;
            // Auto-detect: if it looks like URL, use as URL
            if(val.match(/^https?:\/\//)){
                try{const u=new URL(val);const name=u.hostname.replace('www.','');
                    BM[cat].push({name,url:val,addedAt:new Date().toISOString()});
                    persistBM();qaInput.value='';renderDashboard();
                    showUndo(`"${name}" 추가됨`,null);
                }catch{qaInput.classList.add('qa-error');setTimeout(()=>qaInput.classList.remove('qa-error'),500)}
            } else if(val.includes('.')){
                // Likely a domain without protocol
                const url='https://'+val;
                try{const u=new URL(url);const name=u.hostname.replace('www.','');
                    BM[cat].push({name,url,addedAt:new Date().toISOString()});
                    persistBM();qaInput.value='';renderDashboard();
                    showUndo(`"${name}" 추가됨`,null);
                }catch{}
            } else {
                // Name only → open modal with name pre-filled
                openBMModal('add',cat);
                setTimeout(()=>{const nm=document.getElementById('bm-name');if(nm){nm.value=val;document.getElementById('bm-url')?.focus()}},150);
                qaInput.value='';
            }
        }
        if(e.key==='Escape'){qaInput.blur();qaInput.value=''}
    });
    // Paste: just let the user paste, they press Enter to confirm
    quickAdd.appendChild(qaInput);
    // Advanced add button (for manual name/icon setting)
    const advBtn=document.createElement('button');advBtn.className='bm-qa-adv';advBtn.textContent='⚙';advBtn.title='상세 추가';
    advBtn.addEventListener('click',()=>openBMModal('add',cat));
    quickAdd.appendChild(advBtn);
    list.appendChild(quickAdd);
    card.appendChild(list);return card;
}

function createBookmarkEl(cat,item,idx){
    const link=document.createElement('a');link.href=item.url;link.target='_self';
    link.className='bookmark-item';link.title=item.name;link.dataset.category=cat;link.dataset.index=idx;

    if(CFG.usageTracking){const u=USAGE[item.url];
        if(u){if(u.count>=10)link.classList.add('frequent');
            const last=u.lastUsed?new Date(u.lastUsed):null;
            if(last&&(Date.now()-last.getTime())<864e5)link.classList.add('recent')}}

    link.addEventListener('click',e=>{
        if(CFG.usageTracking){
            // Update local USAGE immediately for UI responsiveness
            if(!USAGE[item.url])USAGE[item.url]={count:0,lastUsed:null,hourly:{},history:[]};
            USAGE[item.url].count++;
            USAGE[item.url].lastUsed=new Date().toISOString();
            const h=new Date().getHours().toString();
            if(!USAGE[item.url].hourly)USAGE[item.url].hourly={};
            USAGE[item.url].hourly[h]=(USAGE[item.url].hourly[h]||0)+1;
            // Persist to server
            fetch('/api/usage/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:item.url})}).catch(()=>{});
        }});

    // Hover edit/delete buttons (always visible on hover, no edit mode needed)
    const hoverBtns=document.createElement('div');hoverBtns.className='bm-hover-btns';
    const editBtn=document.createElement('button');editBtn.className='bm-hover-btn';editBtn.textContent='✎';editBtn.title='편집';
    editBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBMModal('edit',cat,idx)});
    // 2026-08-20 UX 개선: 다른 카테고리로 옮기는 방법이 정밀한 드래그·우클릭 메뉴·편집창
    // 카테고리 선택뿐이라 발견하기 어렵다는 지적(사용성 감사) — 다른 페이지로 드롭할 때
    // 이미 쓰던 "카테고리 목록 클릭" 팝업을, 더 흔한 케이스인 "같은 페이지 안에서 옮기기"
    // 에도 그대로 재사용해 눈에 보이는 버튼 하나로 접근할 수 있게 한다.
    const moveBtn=document.createElement('button');moveBtn.className='bm-hover-btn';moveBtn.textContent='⇄';moveBtn.title='다른 카테고리로 이동';
    moveBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showMoveWithinPageCategoryPicker(item,cat,idx)});
    const delBtn=document.createElement('button');delBtn.className='bm-hover-btn bm-hover-del';delBtn.textContent='×';delBtn.title='삭제';
    delBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();
        TRASH.push({...item,category:cat,deletedAt:new Date().toISOString()});persistTrash();
        const backup={item:JSON.parse(JSON.stringify(item)),cat,idx};
        BM[cat].splice(idx,1);persistBM();renderDashboard();
        showUndo(`"${item.name}" 삭제됨`,()=>{BM[backup.cat].splice(backup.idx,0,backup.item);TRASH.pop();persistBM();persistTrash();renderDashboard()});
    });
    hoverBtns.appendChild(editBtn);hoverBtns.appendChild(moveBtn);hoverBtns.appendChild(delBtn);
    link.appendChild(hoverBtns);

    link.draggable=true;
    link.addEventListener('dragstart',e=>{dragSrc={cat,idx:parseInt(link.dataset.index)};link.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
    link.addEventListener('dragend',()=>{link.classList.remove('dragging');document.querySelectorAll('.drag-over,.drag-over-top,.drag-over-bottom').forEach(el=>{el.classList.remove('drag-over','drag-over-top','drag-over-bottom')});dragSrc=null});
    link.addEventListener('dragover',e=>{if(!dragSrc||catDragSrc)return;e.preventDefault();
        const rect=link.getBoundingClientRect();const midY=rect.top+rect.height/2;
        link.classList.remove('drag-over-top','drag-over-bottom');
        link.classList.add(e.clientY<midY?'drag-over-top':'drag-over-bottom')});
    link.addEventListener('dragleave',()=>link.classList.remove('drag-over','drag-over-top','drag-over-bottom'));
    link.addEventListener('drop',e=>{
        if(catDragSrc)return;e.preventDefault();e.stopPropagation();
        const isTop=link.classList.contains('drag-over-top');
        link.classList.remove('drag-over','drag-over-top','drag-over-bottom');
        if(!dragSrc)return;const dc=link.dataset.category;let di=parseInt(link.dataset.index);
        if(dragSrc.cat===dc){const a=BM[dc];const[m]=a.splice(dragSrc.idx,1);if(dragSrc.idx<di)di--;if(!isTop)di++;a.splice(di,0,m)}
        else{const[m]=BM[dragSrc.cat].splice(dragSrc.idx,1);if(!isTop)di++;BM[dc].splice(di,0,m)}
        dragSrc=null;persistBM();renderDashboard()});

    const iconC=document.createElement('div');iconC.className='bookmark-icon';
    resolveIcon(item.url,iconC,item.name,{iconPath:item.icon||DEFAULT_ICONS[item.name]});

    const nm=document.createElement('span');nm.className='bookmark-name';nm.textContent=item.name;
    link.appendChild(iconC);link.appendChild(nm);
    // Pin indicator
    if(item.pinned){link.classList.add('pinned');const pin=document.createElement('span');pin.className='pin-badge';pin.textContent='📌';pin.title='상단 고정됨';link.appendChild(pin)}
    // A5: NEW badge (items added within 7 days)
    if(item.addedAt){const age=(Date.now()-new Date(item.addedAt).getTime())/864e5;
        if(age<7){const badge=document.createElement('span');badge.className='new-badge';badge.textContent='NEW';link.appendChild(badge)}
        else{delete item.addedAt}}
    // A2: Dead link indicator
    if(CFG.deadLinks[item.url]){const warn=document.createElement('span');warn.className='dead-link-badge';warn.textContent='⚠';warn.title='링크 접속 불가';link.appendChild(warn)}
    return link;
}

function makeGlass(el,name){
    const label=name.replace(/^(https?:\/\/)?(www\.)?/,'').substring(0,2).toUpperCase();
    const hue=(name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)*37)%360;
    el.style.background=`hsl(${hue},40%,25%)`;
    el.innerHTML=`<span style="font-weight:700;font-size:1rem;color:hsl(${hue},60%,75%);line-height:1">${esc(label)}</span>`;
}

// ====================================================================
//  TAB HISTORY RECOMMENDATIONS
// ====================================================================
function getRecommendations(currentCat){
    if(!CFG.usageTracking||!CFG.showRecommendations)return[];
    // Find most-used bookmarks in the current category by URL
    const catItems=BM[currentCat]||[];
    const entries=catItems.map(item=>{
        const u=USAGE[item.url];
        return u&&u.count>=5?{item,count:u.count,category:currentCat}:null;
    }).filter(Boolean).sort((a,b)=>b.count-a.count).slice(0,3);
    return entries.map(e=>({...e.item,category:e.category}));
}

// ====================================================================
//  NOTEPAD
// ====================================================================


function createNotepadCard(mc){
    const card=document.createElement('div');card.className='card-common notepad-card';card.dataset.memoId=mc.id;
    const title=document.createElement('div');title.className='card-title';
    title.innerHTML=`
        <span class="cat-drag-handle" draggable="true" title="드래그로 순서 변경">⠿</span>
        <span class="collapse-arrow">▼</span>
        <span class="card-title-text">${esc(mc.title)}</span>
        <div class="card-title-btns">
            <div class="card-edit-btns">
                <button class="card-edit-btn memo-rename-btn" title="이름 변경">✎</button>
                <button class="card-edit-btn memo-add-line-btn" title="줄 추가">+</button>
                <button class="card-edit-btn danger memo-del-btn" title="삭제">×</button>
            </div>
        </div>`;
    const key='__notepad_'+mc.id;
    if(CFG.collapsedCategories.includes(key))card.classList.add('collapsed');

    // Collapse
    title.addEventListener('click',e=>{
        if(e.target.closest('.card-edit-btns')||e.target.closest('.cat-drag-handle'))return;
        card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(key))CFG.collapsedCategories.push(key)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==key)}persistConfig()});

    // Rename
    title.querySelector('.memo-rename-btn').addEventListener('click',e=>{
        e.stopPropagation();
        const titleText=title.querySelector('.card-title-text');
        const oldName=mc.title;titleText.contentEditable=true;titleText.focus();
        titleText.classList.add('inline-editing');
        const save=()=>{titleText.contentEditable=false;titleText.classList.remove('inline-editing');
            const newName=titleText.textContent.trim();if(newName&&newName!==oldName){mc.title=newName;persistConfig()}};
        titleText.addEventListener('blur',save,{once:true});
        titleText.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();titleText.blur()}if(ev.key==='Escape'){titleText.textContent=oldName;titleText.blur()}});
    });

    // Add line
    title.querySelector('.memo-add-line-btn').addEventListener('click',e=>{
        e.stopPropagation();
        mc.lines=(mc.lines||6)+1;NOTES[mc.id].push('');
        persistConfig();persistNotes();renderDashboard()});

    // Delete memo card
    title.querySelector('.memo-del-btn').addEventListener('click',e=>{
        e.stopPropagation();
        const backup={mc:JSON.parse(JSON.stringify(mc)),notes:[...NOTES[mc.id]],idx:CFG.memoCards.indexOf(mc)};
        CFG.memoCards=CFG.memoCards.filter(m=>m.id!==mc.id);delete NOTES[mc.id];
        persistConfig();persistNotes();renderDashboard();
        showUndo(`"${mc.title}" 삭제됨`,()=>{CFG.memoCards.splice(backup.idx,0,backup.mc);NOTES[backup.mc.id]=backup.notes;persistConfig();persistNotes();renderDashboard()});
    });

    // Memo drag handle
    const handle=title.querySelector('.cat-drag-handle');
    handle.addEventListener('dragstart',e=>{e.dataTransfer.setData('memo-drag',mc.id);card.classList.add('cat-dragging');e.dataTransfer.effectAllowed='move'});
    handle.addEventListener('dragend',()=>card.classList.remove('cat-dragging'));
    card.addEventListener('dragover',e=>{const dragId=e.dataTransfer.types.includes('memo-drag')?true:false;if(!dragId)return;e.preventDefault();card.classList.add('drag-over-card')});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over-card'));
    card.addEventListener('drop',e=>{card.classList.remove('drag-over-card');
        const dragId=e.dataTransfer.getData('memo-drag');if(!dragId||dragId===mc.id)return;e.preventDefault();
        const fi=CFG.memoCards.findIndex(m=>m.id===dragId);const ti=CFG.memoCards.findIndex(m=>m.id===mc.id);
        if(fi===-1)return;const[moved]=CFG.memoCards.splice(fi,1);CFG.memoCards.splice(ti,0,moved);
        persistConfig();renderDashboard()});

    card.appendChild(title);

    const list=document.createElement('div');list.className='memo-list';
    const notes=NOTES[mc.id]||[];
    for(let j=0;j<(mc.lines||6);j++){
        const line=document.createElement('div');line.className='memo-item';
        line.contentEditable=true;line.dataset.placeholder='여기에 입력...';
        line.dataset.memoId=mc.id;line.dataset.lineIndex=j;
        const c=notes[j]||'';if(c)line.textContent=c;list.appendChild(line);
    }
    card.appendChild(list);return card;
}

function setupNotepads(){
    const memos=document.querySelectorAll('.memo-item');let st;
    const save=()=>{clearTimeout(st);st=setTimeout(()=>{
        memos.forEach(m=>{const mid=m.dataset.memoId;const li=parseInt(m.dataset.lineIndex);
            if(!NOTES[mid])NOTES[mid]=[];NOTES[mid][li]=m.textContent});
        persistNotes()},600)};
    memos.forEach(m=>{m.addEventListener('input',()=>save());m.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault()});
        m.addEventListener('blur',()=>autoLinkMemo(m));m.addEventListener('focus',()=>unlinkMemo(m));if(m.textContent.trim())autoLinkMemo(m)})
}
const URL_RE=/(https?:\/\/[^\s<>"']+)/g;
function autoLinkMemo(m){const t=m.textContent;if(!URL_RE.test(t)&&!/\*|`|\[/.test(t))return;
    // C3: Markdown preview
    if(/\*|`|\[/.test(t)){m.innerHTML=renderMiniMarkdown(esc(t));return}
    URL_RE.lastIndex=0;const f=document.createDocumentFragment();let li=0;t.replace(URL_RE,(match,url,off)=>{if(off>li)f.appendChild(document.createTextNode(t.slice(li,off)));const a=document.createElement('a');a.href=url;a.className='auto-link';a.target='_blank';a.textContent=url;a.addEventListener('click',e=>e.stopPropagation());f.appendChild(a);li=off+match.length});if(li<t.length)f.appendChild(document.createTextNode(t.slice(li)));m.innerHTML='';m.appendChild(f)}
function unlinkMemo(m){m.textContent=m.textContent}

// ====================================================================
//  TODO CARD
// ====================================================================
function createTodoCard(tc){
    const cardTodos=TODOS.filter(t=>t.cardId===tc.id);
    const card=document.createElement('div');card.className='card-common todo-card';const key='__todo_'+tc.id;
    if(CFG.collapsedCategories.includes(key))card.classList.add('collapsed');
    const title=document.createElement('div');title.className='card-title';
    title.innerHTML=`
        <span class="cat-drag-handle" draggable="true" title="드래그로 순서 변경">⠿</span>
        <span class="collapse-arrow">▼</span>
        <span class="card-title-text">📋 ${esc(tc.title)}</span>
        <div class="card-title-btns"><div class="card-edit-btns">
            <button class="card-edit-btn todo-rename-btn" title="이름 변경">✎</button>
            <button class="card-edit-btn danger widget-remove-btn" title="삭제">×</button>
        </div></div>`;
    // C2: Progress bar
    const done=cardTodos.filter(t=>t.done).length,total=cardTodos.length;
    if(total>0){
        const prog=document.createElement('div');prog.className='todo-progress';
        prog.innerHTML=`<div class="todo-prog-bar"><div class="todo-prog-fill" style="width:${Math.round(done/total*100)}%"></div></div><span class="todo-prog-text">${done}/${total}</span>`;
        title.appendChild(prog);
    }
    title.addEventListener('click',e=>{if(e.target.closest('.card-edit-btns')||e.target.closest('.cat-drag-handle'))return;card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(key))CFG.collapsedCategories.push(key)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==key)}persistConfig()});
    // Rename
    title.querySelector('.todo-rename-btn').addEventListener('click',e=>{
        e.stopPropagation();const titleText=title.querySelector('.card-title-text');
        const oldName=tc.title;titleText.textContent=oldName;titleText.contentEditable=true;titleText.focus();titleText.classList.add('inline-editing');
        const save=()=>{titleText.contentEditable=false;titleText.classList.remove('inline-editing');
            const newName=titleText.textContent.trim();if(newName&&newName!==oldName){tc.title=newName;persistConfig()}titleText.textContent='📋 '+tc.title};
        titleText.addEventListener('blur',save,{once:true});
        titleText.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();titleText.blur()}if(ev.key==='Escape'){titleText.textContent=oldName;titleText.blur()}});
    });
    // Delete
    title.querySelector('.widget-remove-btn').addEventListener('click',e=>{e.stopPropagation();
        if(CFG.todoCards.length===1){CFG.showTodo=false;persistConfig();renderDashboard();showUndo('"할 일" 카드 제거됨',()=>{CFG.showTodo=true;persistConfig();renderDashboard()});return}
        const backup={tc:JSON.parse(JSON.stringify(tc)),todos:cardTodos.map(t=>JSON.parse(JSON.stringify(t))),idx:CFG.todoCards.indexOf(tc)};
        CFG.todoCards=CFG.todoCards.filter(c=>c.id!==tc.id);TODOS=TODOS.filter(t=>t.cardId!==tc.id);
        persistConfig();persistTodos();renderDashboard();
        showUndo(`"${tc.title}" 삭제됨`,()=>{CFG.todoCards.splice(backup.idx,0,backup.tc);TODOS.push(...backup.todos);persistConfig();persistTodos();renderDashboard()});
    });
    // Drag handle for reorder
    const handle=title.querySelector('.cat-drag-handle');
    handle.addEventListener('dragstart',e=>{e.dataTransfer.setData('todo-card-drag',tc.id);card.classList.add('cat-dragging');e.dataTransfer.effectAllowed='move'});
    handle.addEventListener('dragend',()=>card.classList.remove('cat-dragging'));
    card.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('todo-card-drag')){e.preventDefault();card.classList.add('drag-over-card')}});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over-card'));
    card.addEventListener('drop',e=>{card.classList.remove('drag-over-card');
        const dragId=e.dataTransfer.getData('todo-card-drag');if(!dragId||dragId===tc.id)return;e.preventDefault();e.stopPropagation();
        const fi=CFG.todoCards.findIndex(c=>c.id===dragId);const ti=CFG.todoCards.findIndex(c=>c.id===tc.id);
        if(fi===-1)return;const[moved]=CFG.todoCards.splice(fi,1);CFG.todoCards.splice(ti,0,moved);
        persistConfig();renderDashboard()});

    card.appendChild(title);
    const list=document.createElement('div');list.className='todo-list';
    // A4: Eisenhower sort (priority × urgency)
    const now=new Date().setHours(0,0,0,0);
    const sorted=[...cardTodos.filter(t=>!t.done).sort((a,b)=>{
        const pa=(a.priority||0),pb=(b.priority||0);
        const ua=a.dueDate?Math.max(0,7-Math.ceil((new Date(a.dueDate)-now)/864e5)):0;
        const ub=b.dueDate?Math.max(0,7-Math.ceil((new Date(b.dueDate)-now)/864e5)):0;
        return (pb+ub)-(pa+ua);
    }),...cardTodos.filter(t=>t.done)];
    sorted.forEach(t=>list.appendChild(createTodoItem(t)));
    if(!cardTodos.length){const empty=document.createElement('div');empty.className='empty-state';empty.innerHTML='<span class="empty-state-icon">✅</span><span>아래에 할 일을 추가하세요</span>';list.appendChild(empty)}
    if(cardTodos.length>10){const more=document.createElement('button');more.className='todo-more-btn';more.textContent=`칸반 보기`;more.addEventListener('click',()=>openModal('modal-todo-full'));list.appendChild(more)}
    // Inline add input
    const addRow=document.createElement('div');addRow.className='todo-add-row';
    const addInput=document.createElement('input');addInput.type='text';addInput.className='todo-add-input';
    addInput.placeholder='+ 할 일 추가...';addInput.autocomplete='off';
    addInput.addEventListener('keydown',e=>{if(e.key==='Enter'){const text=addInput.value.trim();if(!text)return;
        TODOS.push({id:Date.now(),text,done:false,priority:0,dueDate:'',tags:[],subtasks:[],recurring:'',cardId:tc.id});
        persistTodos();addInput.value='';renderDashboard()}
        if(e.key==='Escape'){addInput.blur();addInput.value=''}});
    addRow.appendChild(addInput);list.appendChild(addRow);
    card.appendChild(list);return card;
}
function createTodoItem(t){
    if(!t.subtasks)t.subtasks=[];if(!t.tags)t.tags=[];if(!t.recurring)t.recurring='';
    const row=document.createElement('div');row.className='todo-item';
    const chk=document.createElement('button');chk.className='todo-check'+(t.done?' checked':'');chk.textContent=t.done?'✓':'';
    chk.addEventListener('click',()=>{
        t.done=!t.done;
        if(t.done){
            if(t.subtasks)t.subtasks.forEach(s=>s.done=true);
            const today=new Date().toISOString().slice(0,10);
            if(!CFG.todoCompletionDates.includes(today)){CFG.todoCompletionDates.push(today);persistConfig()}
            // Visual feedback: brief animation before re-render
            chk.classList.add('checked');chk.textContent='✓';
            const todoRow=row.closest('.todo-with-subs')||row;
            todoRow.style.opacity='.5';todoRow.style.transition='opacity .25s';
        }
        if(t.done&&t.recurring){const next=getNextRecurring(t.dueDate,t.recurring);
            TODOS.push({id:Date.now(),text:t.text,done:false,priority:t.priority,dueDate:next,tags:[...t.tags],subtasks:t.subtasks.map(s=>({...s,done:false})),recurring:t.recurring,cardId:t.cardId})}
        persistTodos();setTimeout(()=>renderDashboard(),t.done?200:0)});
    const priorities=['⚪','🔴','🟡','🟢'];
    const pri=document.createElement('button');pri.className='todo-priority';pri.textContent=priorities[t.priority||0];
    pri.title='우선순위';pri.addEventListener('click',()=>{t.priority=((t.priority||0)+1)%4;persistTodos();renderDashboard()});
    const txt=document.createElement('input');txt.type='text';txt.className='todo-text'+(t.done?' done':'');txt.value=t.text;
    txt.addEventListener('input',()=>{t.text=txt.value;persistTodos()});
    txt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();TODOS.push({id:Date.now(),text:'',done:false,priority:0,dueDate:'',tags:[],subtasks:[],recurring:'',cardId:t.cardId});persistTodos();renderDashboard()}});
    const due=document.createElement('input');due.type='date';due.className='todo-due';due.value=t.dueDate||'';
    if(t.dueDate){const diff=Math.ceil((new Date(t.dueDate)-new Date().setHours(0,0,0,0))/864e5);if(diff<0)due.classList.add('overdue');else if(diff===0)due.classList.add('today')}
    due.addEventListener('change',()=>{t.dueDate=due.value;persistTodos();renderDashboard()});
    // C6: Tag indicator
    const tagEl=document.createElement('span');tagEl.className='todo-tag-dots';
    if(t.tags?.length){t.tags.forEach(tag=>{const d=document.createElement('span');d.className='todo-tag-dot';d.title=tag;
        const colors={'업무':'#6ea8fe','개인':'#4ade80','긴급':'#f87171','아이디어':'#fbbf24'};d.style.background=colors[tag]||'var(--accent)';tagEl.appendChild(d)})}
    tagEl.style.cursor='pointer';tagEl.addEventListener('click',e=>{e.stopPropagation();showTagPicker(t,tagEl)});
    // C4: Recurring indicator
    const recur=document.createElement('span');
    if(t.recurring){recur.className='todo-recur';recur.textContent='🔁';recur.title='반복: '+t.recurring;
        recur.style.cssText='font-size:.65rem;cursor:pointer';recur.addEventListener('click',e=>{e.stopPropagation();showRecurPicker(t)})}
    const del=document.createElement('button');del.className='todo-del';del.textContent='×';
    del.addEventListener('click',()=>{
        const backup={todo:JSON.parse(JSON.stringify(t)),idx:TODOS.indexOf(t)};
        TODOS=TODOS.filter(x=>x.id!==t.id);persistTodos();renderDashboard();
        showUndo(`"${t.text||'할 일'}" 삭제됨`,()=>{TODOS.splice(backup.idx,0,backup.todo);persistTodos();renderDashboard()})
    });
    // C6: Timer link button
    const timerBtn=document.createElement('button');timerBtn.className='todo-timer-btn';timerBtn.textContent='▶';timerBtn.title='포모도로 시작';
    timerBtn.addEventListener('click',e=>{e.stopPropagation();startPomoForTodo(t)});
    row.appendChild(chk);row.appendChild(pri);row.appendChild(txt);row.appendChild(tagEl);row.appendChild(recur);row.appendChild(timerBtn);row.appendChild(due);row.appendChild(del);
    // Todo drag-sort
    row.draggable=true;row.dataset.todoId=t.id;
    row.addEventListener('dragstart',e=>{
        e.dataTransfer.setData('todo-item-drag',String(t.id));
        e.dataTransfer.effectAllowed='move';row.classList.add('dragging');
    });
    row.addEventListener('dragend',()=>{row.classList.remove('dragging');document.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(el=>el.classList.remove('drag-over-top','drag-over-bottom'))});
    row.addEventListener('dragover',e=>{
        if(!e.dataTransfer.types.includes('todo-item-drag'))return;e.preventDefault();
        const rect=row.getBoundingClientRect();const midY=rect.top+rect.height/2;
        row.classList.remove('drag-over-top','drag-over-bottom');
        row.classList.add(e.clientY<midY?'drag-over-top':'drag-over-bottom');
    });
    row.addEventListener('dragleave',()=>row.classList.remove('drag-over-top','drag-over-bottom'));
    row.addEventListener('drop',e=>{
        row.classList.remove('drag-over-top','drag-over-bottom');
        const dragId=e.dataTransfer.getData('todo-item-drag');if(!dragId)return;e.preventDefault();e.stopPropagation();
        const srcIdx=TODOS.findIndex(x=>String(x.id)===dragId);
        const dstIdx=TODOS.indexOf(t);if(srcIdx===-1||srcIdx===dstIdx)return;
        const isTop=row.classList.contains('drag-over-top');
        const[moved]=TODOS.splice(srcIdx,1);
        let insertIdx=TODOS.indexOf(t);if(!isTop)insertIdx++;
        TODOS.splice(insertIdx,0,moved);
        persistTodos();renderDashboard();
    });
    // C1: Sub-tasks
    if(t.subtasks?.length||t.text){
        const wrapper=document.createElement('div');wrapper.className='todo-with-subs';wrapper.appendChild(row);
        if(t.subtasks?.length){
            const subList=document.createElement('div');subList.className='todo-sub-list';
            t.subtasks.forEach((s,si)=>{
                const sr=document.createElement('div');sr.className='todo-sub-item';
                sr.innerHTML=`<button class="todo-sub-check${s.done?' checked':''}">${s.done?'✓':''}</button><input type="text" class="todo-sub-text${s.done?' done':''}" value="${esc(s.text)}"><button class="todo-sub-del">×</button>`;
                sr.querySelector('.todo-sub-check').addEventListener('click',()=>{s.done=!s.done;persistTodos();renderDashboard()});
                sr.querySelector('.todo-sub-text').addEventListener('input',e=>{s.text=e.target.value;persistTodos()});
                sr.querySelector('.todo-sub-del').addEventListener('click',()=>{t.subtasks.splice(si,1);persistTodos();renderDashboard()});
                subList.appendChild(sr)});
            wrapper.appendChild(subList);
        }
        // Sub-task add button (shown on hover)
        const addSub=document.createElement('button');addSub.className='todo-add-sub';addSub.textContent='+ 하위';
        addSub.addEventListener('click',()=>{t.subtasks.push({text:'',done:false});persistTodos();renderDashboard()});
        wrapper.appendChild(addSub);
        return wrapper;
    }
    return row;
}
// C4: Get next recurring date
function getNextRecurring(dateStr,recurring){
    const d=dateStr?new Date(dateStr):new Date();
    if(recurring==='매일')d.setDate(d.getDate()+1);
    else if(recurring==='매주')d.setDate(d.getDate()+7);
    else if(recurring==='매월')d.setMonth(d.getMonth()+1);
    else if(recurring==='평일'){d.setDate(d.getDate()+1);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1)}
    return d.toISOString().slice(0,10);
}
// C4: Process recurring todos on boot
function processRecurringTodos(){
    const today=new Date().toISOString().slice(0,10);
    TODOS.filter(t=>t.done&&t.recurring&&t.dueDate&&t.dueDate<today).forEach(t=>{
        const exists=TODOS.find(x=>!x.done&&x.text===t.text&&x.recurring===t.recurring);
        if(!exists){const next=getNextRecurring(t.dueDate,t.recurring);
            TODOS.push({id:Date.now()+Math.random(),text:t.text,done:false,priority:t.priority,dueDate:next,tags:[...(t.tags||[])],subtasks:(t.subtasks||[]).map(s=>({...s,done:false})),recurring:t.recurring,cardId:t.cardId})}
    });
}
// C6: Tag picker popup
function showTagPicker(todo,anchor){
    const existing=document.querySelector('.tag-picker-popup');if(existing)existing.remove();
    const popup=document.createElement('div');popup.className='tag-picker-popup';
    (CFG.todoTags||[]).forEach(tag=>{
        const btn=document.createElement('button');btn.className='tag-pick-btn'+(todo.tags?.includes(tag)?' active':'');btn.textContent=tag;
        btn.addEventListener('click',()=>{if(!todo.tags)todo.tags=[];
            if(todo.tags.includes(tag))todo.tags=todo.tags.filter(t=>t!==tag);else todo.tags.push(tag);
            persistTodos();renderDashboard();popup.remove()});
        popup.appendChild(btn)});
    document.body.appendChild(popup);
    const r=anchor.getBoundingClientRect();popup.style.left=r.left+'px';popup.style.top=(r.bottom+4)+'px';
    setTimeout(()=>document.addEventListener('click',()=>popup.remove(),{once:true}),10);
}
// C4: Recurring picker popup
function showRecurPicker(todo){
    const existing=document.querySelector('.recur-picker-popup');if(existing)existing.remove();
    const popup=document.createElement('div');popup.className='tag-picker-popup';
    ['','매일','평일','매주','매월'].forEach(opt=>{
        const btn=document.createElement('button');btn.className='tag-pick-btn'+(todo.recurring===opt?' active':'');
        btn.textContent=opt||'반복 없음';
        btn.addEventListener('click',()=>{todo.recurring=opt;persistTodos();renderDashboard();popup.remove()});
        popup.appendChild(btn)});
    document.body.appendChild(popup);popup.style.left='50%';popup.style.top='50%';popup.style.transform='translate(-50%,-50%)';popup.style.position='fixed';
    setTimeout(()=>document.addEventListener('click',()=>popup.remove(),{once:true}),10);
}


// ====================================================================
//  CALENDAR CARD (with Events)
// ====================================================================
function createCalendarCard(){
    const card=document.createElement('div');card.className='card-common calendar-card';const key='__calendar';
    if(CFG.collapsedCategories.includes(key))card.classList.add('collapsed');
    const title=document.createElement('div');title.className='card-title';
    title.innerHTML='<span class="collapse-arrow">▼</span><span class="card-title-text">📅 달력</span><div class="card-title-btns"><div class="card-edit-btns"><button class="card-edit-btn danger widget-remove-btn" title="카드 제거">×</button></div></div>';
    title.addEventListener('click',e=>{if(e.target.closest('.card-edit-btns'))return;card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(key))CFG.collapsedCategories.push(key)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==key)}persistConfig()});
    title.querySelector('.widget-remove-btn').addEventListener('click',e=>{e.stopPropagation();CFG.showCalendar=false;persistConfig();renderDashboard();showUndo('"달력" 카드 제거됨',()=>{CFG.showCalendar=true;persistConfig();renderDashboard()})});
    card.appendChild(title);
    const now=new Date();if(calMonth===null){calMonth=now.getMonth();calYear=now.getFullYear()}
    const nav=document.createElement('div');nav.className='cal-nav';
    nav.innerHTML=`<button class="cal-nav-btn" id="cal-prev">◀</button><span class="cal-month">${calYear}년 ${calMonth+1}월</span><button class="cal-nav-btn" id="cal-next">▶</button><button class="cal-view-toggle" id="cal-view-toggle" title="주간/월간 전환">${CFG.calWeeklyView?'📅':'📋'}</button>`;
    card.appendChild(nav);
    nav.querySelector('#cal-prev').addEventListener('click',e=>{e.stopPropagation();calMonth--;if(calMonth<0){calMonth=11;calYear--}renderDashboard()});
    nav.querySelector('#cal-next').addEventListener('click',e=>{e.stopPropagation();calMonth++;if(calMonth>11){calMonth=0;calYear++}renderDashboard()});
    nav.querySelector('#cal-view-toggle').addEventListener('click',e=>{e.stopPropagation();CFG.calWeeklyView=!CFG.calWeeklyView;persistConfig();renderDashboard()});

    const grid=document.createElement('div');grid.className='calendar-grid'+(CFG.calWeeklyView?' weekly-view':'');
    const headers=CFG.calendarStartMonday?['월','화','수','목','금','토','일']:['일','월','화','수','목','금','토'];
    headers.forEach(h=>{const d=document.createElement('div');d.className='cal-header';d.textContent=h;grid.appendChild(d)});

    const first=new Date(calYear,calMonth,1);const startDay=first.getDay();
    const offset=CFG.calendarStartMonday?(startDay===0?6:startDay-1):startDay;
    const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
    const daysInPrev=new Date(calYear,calMonth,0).getDate();
    const today=new Date();const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const ddayDates=new Set(DDAYS.map(d=>d.date));

    // Build event map for this month (A4: include todos with due dates)
    const eventMap={};
    EVENTS.forEach(ev=>{if(!eventMap[ev.date])eventMap[ev.date]=[];eventMap[ev.date].push(ev)});
    TODOS.filter(t=>t.dueDate&&!t.done).forEach(t=>{if(!eventMap[t.dueDate])eventMap[t.dueDate]=[];eventMap[t.dueDate].push({id:'todo-'+t.id,name:'📋 '+t.text,date:t.dueDate,color:t.priority===1?'#f87171':t.priority===2?'#fbbf24':t.priority===3?'#4ade80':'#6ea8fe',isTodo:true})});

    // B3: Weekly view - only show current week
    let renderStart=1,renderEnd=daysInMonth,showOffset=offset;
    if(CFG.calWeeklyView){
        const selDate=calSelectedDate?new Date(calSelectedDate+'T00:00:00'):today;
        const selDay=selDate.getDate();
        const selDow=selDate.getDay();
        const weekStart=CFG.calendarStartMonday?(selDow===0?selDay-6:selDay-(selDow-1)):selDay-selDow;
        renderStart=Math.max(1,weekStart);renderEnd=Math.min(daysInMonth,renderStart+6);
        showOffset=0;
        // Recalculate offset for partial week
        const fd=new Date(calYear,calMonth,renderStart).getDay();
        showOffset=CFG.calendarStartMonday?(fd===0?6:fd-1):fd;
    }

    if(!CFG.calWeeklyView){
        for(let i=0;i<offset;i++){const d=document.createElement('div');d.className='cal-day other';d.textContent=daysInPrev-offset+i+1;grid.appendChild(d)}
    } else {
        for(let i=0;i<showOffset;i++){const d=document.createElement('div');d.className='cal-day other';d.textContent='';grid.appendChild(d)}
    }
    for(let i=renderStart;i<=renderEnd;i++){
        const d=document.createElement('div');d.className='cal-day';d.textContent=i;
        const dateStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        d.dataset.date=dateStr;
        if(dateStr===todayStr)d.classList.add('today');
        if(dateStr===calSelectedDate)d.classList.add('selected');
        if(ddayDates.has(dateStr))d.classList.add('has-dday');
        // Event dots
        const dayEvents=eventMap[dateStr];
        if(dayEvents&&dayEvents.length){
            const dots=document.createElement('div');dots.className='event-dots';
            dayEvents.slice(0,3).forEach(ev=>{const dot=document.createElement('span');dot.className='event-dot';dot.style.background=ev.color||'#6ea8fe';dots.appendChild(dot)});
            d.appendChild(dots);
        }
        d.addEventListener('click',e=>{e.stopPropagation();calSelectedDate=dateStr;renderDashboard();
            setTimeout(()=>{const inp=document.querySelector('.cal-qa-input');if(inp)inp.focus()},50)});
        // C5: Drop event to change date
        d.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/plain')){e.preventDefault();d.classList.add('drag-target')}});
        d.addEventListener('dragleave',()=>d.classList.remove('drag-target'));
        d.addEventListener('drop',e=>{d.classList.remove('drag-target');const evId=parseInt(e.dataTransfer.getData('text/plain'));
            const ev=EVENTS.find(x=>x.id===evId);if(ev){ev.date=dateStr;persistEvents();calSelectedDate=dateStr;renderDashboard()}});
        grid.appendChild(d)}
    const totalCells=(CFG.calWeeklyView?showOffset:offset)+(renderEnd-renderStart+1);const remaining=totalCells%7===0?0:7-totalCells%7;
    for(let i=1;i<=remaining;i++){const d=document.createElement('div');d.className='cal-day other';d.textContent=CFG.calWeeklyView?'':i;grid.appendChild(d)}
    card.appendChild(grid);

    // Events section for selected date
    const evSection=document.createElement('div');evSection.className='cal-events-section';
    const showDate=calSelectedDate||todayStr;
    const dateEvents=(eventMap[showDate]||[]);
    const dateDdays=DDAYS.filter(dd=>dd.date===showDate);

    // Date label
    const dateLabel=document.createElement('div');dateLabel.className='cal-date-label';
    const sd=new Date(showDate+'T00:00:00');
    const dayNames=['일','월','화','수','목','금','토'];
    dateLabel.innerHTML=`<span class="cal-date-text">${sd.getMonth()+1}/${sd.getDate()} (${dayNames[sd.getDay()]})</span>`;
    if(showDate===todayStr)dateLabel.innerHTML+=`<span class="cal-date-badge">오늘</span>`;
    evSection.appendChild(dateLabel);

    if(dateDdays.length){dateDdays.forEach(dd=>{
        const row=document.createElement('div');row.className='cal-event-row';
        row.innerHTML=`<span class="cal-event-dot" style="background:var(--accent)"></span><span class="cal-event-name">📌 ${esc(dd.label)}</span>`;
        evSection.appendChild(row)})}
    if(dateEvents.length){dateEvents.forEach(ev=>{
        const row=document.createElement('div');row.className='cal-event-row';
        // C5: Make events draggable
        if(!ev.isTodo){row.draggable=true;row.dataset.eventId=ev.id;
            row.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',ev.id);e.dataTransfer.effectAllowed='move';row.classList.add('dragging')});
            row.addEventListener('dragend',()=>row.classList.remove('dragging'))}
        if(ev.isTodo){
            row.innerHTML=`<span class="cal-event-dot" style="background:${esc(ev.color||'#6ea8fe')}"></span><span class="cal-event-name todo-ev">${esc(ev.name)}</span>`;
            row.querySelector('.cal-event-name').addEventListener('click',()=>openModal('modal-todo-full'));
        } else {
            row.innerHTML=`<span class="cal-event-dot" style="background:${esc(ev.color||'#6ea8fe')}"></span><span class="cal-event-name">${ev.startTime?'<b class="ev-time">'+esc(ev.startTime)+'</b> ':''}${esc(ev.name)}${ev.recurring?' 🔁':''}</span><button class="cal-event-edit" title="편집">✎</button><button class="cal-event-del" title="삭제">×</button>`;
            row.querySelector('.cal-event-name').addEventListener('click',()=>openCalEventModal('edit',ev));
            row.querySelector('.cal-event-edit').addEventListener('click',e=>{e.stopPropagation();openCalEventModal('edit',ev)});
            row.querySelector('.cal-event-del').addEventListener('click',e=>{e.stopPropagation();deleteCalEvent(ev.id)});
        }
        evSection.appendChild(row)})}

    // Inline quick-add form (replaces modal for simple adds)
    const quickAdd=document.createElement('div');quickAdd.className='cal-quick-add';
    const lastColor=CFG.lastEventColor||'#6ea8fe';
    const colorDotEl=document.createElement('button');colorDotEl.className='cal-qa-color';colorDotEl.style.background=lastColor;
    colorDotEl.title='색상 변경';
    let qaColor=lastColor;
    const qaColors=['#6ea8fe','#ef4444','#f59e0b','#22c55e','#a78bfa','#f472b6'];
    colorDotEl.addEventListener('click',e=>{
        e.stopPropagation();
        const idx=(qaColors.indexOf(qaColor)+1)%qaColors.length;
        qaColor=qaColors[idx];colorDotEl.style.background=qaColor;
    });
    const qaInput=document.createElement('input');qaInput.type='text';qaInput.className='cal-qa-input';
    qaInput.placeholder='일정 입력 후 Enter…';qaInput.autocomplete='off';
    const qaHint=document.createElement('span');qaHint.className='cal-qa-hint';qaHint.textContent='!할일';qaHint.title='!로 시작하면 할 일로 추가';
    qaInput.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
            e.preventDefault();const val=qaInput.value.trim();if(!val)return;
            // ! prefix → add as todo
            if(val.startsWith('!')){
                const text=val.slice(1).trim();if(!text)return;
                TODOS.push({id:Date.now(),text,done:false,priority:0,dueDate:showDate,tags:[],subtasks:[],recurring:'',cardId:(CFG.todoCards[0]||{id:'todo_0'}).id});
                persistTodos();calSelectedDate=showDate;renderDashboard();return;
            }
            // Normal → add as event
            EVENTS.push({id:Date.now(),name:val,date:showDate,color:qaColor});
            CFG.lastEventColor=qaColor;persistEvents();persistConfig();calSelectedDate=showDate;renderDashboard();
        }
        if(e.key==='Escape'){qaInput.blur()}
    });
    quickAdd.appendChild(colorDotEl);quickAdd.appendChild(qaInput);quickAdd.appendChild(qaHint);
    evSection.appendChild(quickAdd);

    // Detail button (for modal with more options)
    const detailBtn=document.createElement('button');detailBtn.className='cal-detail-btn';
    detailBtn.innerHTML='상세 추가 ↗';
    detailBtn.addEventListener('click',e=>{e.stopPropagation();openCalEventModal('add',null,showDate)});
    evSection.appendChild(detailBtn);

    card.appendChild(evSection);

    // Double-click on date → open modal for detailed event
    grid.querySelectorAll('.cal-day:not(.other)').forEach(dayEl=>{
        dayEl.addEventListener('dblclick',e=>{
            e.stopPropagation();const date=dayEl.dataset.date;
            calSelectedDate=date;renderDashboard();
            // Focus the quick-add input after re-render
            setTimeout(()=>{const inp=document.querySelector('.cal-qa-input');if(inp)inp.focus()},50);
        });
    });

    return card;
}

// ====================================================================
//  CALENDAR EVENTS CRUD
// ====================================================================
function initCalendarEvents(){
    document.getElementById('btn-cal-event-save')?.addEventListener('click',saveCalEvent);
    document.getElementById('btn-cal-event-delete')?.addEventListener('click',()=>{
        if(editEventId){deleteCalEvent(editEventId);closeModal('modal-cal-event')}});
    document.getElementById('cal-event-colors')?.addEventListener('click',e=>{
        const dot=e.target.closest('.color-dot');if(!dot)return;
        document.querySelectorAll('#cal-event-colors .color-dot').forEach(d=>d.classList.remove('active'));
        dot.classList.add('active')});
}
function openCalEventModal(mode,ev,date){
    const titleEl=document.getElementById('cal-event-title');
    const nameEl=document.getElementById('cal-event-name');
    const dateEl=document.getElementById('cal-event-date');
    const delBtn=document.getElementById('btn-cal-event-delete');
    document.querySelectorAll('#cal-event-colors .color-dot').forEach(d=>d.classList.remove('active'));
    if(mode==='edit'&&ev){
        titleEl.textContent='일정 편집';nameEl.value=ev.name;dateEl.value=ev.date;editEventId=ev.id;delBtn.style.display='block';
        const colorDot=document.querySelector(`#cal-event-colors .color-dot[data-color="${ev.color||'#6ea8fe'}"]`);
        if(colorDot)colorDot.classList.add('active');else document.querySelector('#cal-event-colors .color-dot').classList.add('active');
        // B1: time, B2: recurring
        const st=document.getElementById('cal-event-start-time');if(st)st.value=ev.startTime||'';
        const et=document.getElementById('cal-event-end-time');if(et)et.value=ev.endTime||'';
        const rc=document.getElementById('cal-event-recurring');if(rc)rc.value=ev.recurring||'';
    }else{
        titleEl.textContent='일정 추가';nameEl.value='';dateEl.value=date||new Date().toISOString().slice(0,10);editEventId=null;delBtn.style.display='none';
        document.querySelector('#cal-event-colors .color-dot').classList.add('active');
        const st=document.getElementById('cal-event-start-time');if(st)st.value='';
        const et=document.getElementById('cal-event-end-time');if(et)et.value='';
        const rc=document.getElementById('cal-event-recurring');if(rc)rc.value='';
    }
    openModal('modal-cal-event');setTimeout(()=>nameEl.focus(),100);
}
function saveCalEvent(){
    const name=document.getElementById('cal-event-name').value.trim();
    const date=document.getElementById('cal-event-date').value;
    const colorDot=document.querySelector('#cal-event-colors .color-dot.active');
    const color=colorDot?colorDot.dataset.color:'#6ea8fe';
    // B1: Time fields
    const startTime=document.getElementById('cal-event-start-time')?.value||'';
    const endTime=document.getElementById('cal-event-end-time')?.value||'';
    // B2: Recurring
    const recurring=document.getElementById('cal-event-recurring')?.value||'';
    if(!name)return alert('일정 이름을 입력하세요.');
    if(!date)return alert('날짜를 선택하세요.');
    if(editEventId){
        const ev=EVENTS.find(e=>e.id===editEventId);
        if(ev){ev.name=name;ev.date=date;ev.color=color;ev.startTime=startTime;ev.endTime=endTime;ev.recurring=recurring}
    }else{
        EVENTS.push({id:Date.now(),name,date,color,startTime,endTime,recurring});
        // B2: Generate recurring instances
        if(recurring){generateRecurringEvents({name,date,color,startTime,endTime,recurring})}
    }
    // B3: Schedule notification
    if(CFG.eventNotifications&&startTime){scheduleEventNotification({name,date,startTime})}
    persistEvents();closeModal('modal-cal-event');calSelectedDate=date;renderDashboard();
}
function deleteCalEvent(id){
    const ev=EVENTS.find(e=>e.id===id);
    if(!ev)return;
    const backup={...ev};const idx=EVENTS.indexOf(ev);
    EVENTS.splice(idx,1);persistEvents();renderDashboard();
    showUndo(`"${backup.name}" 삭제됨`,()=>{EVENTS.splice(idx,0,backup);persistEvents();renderDashboard()});
}


// ====================================================================
//  FUZZY & CHOSUNG SEARCH HELPERS
// ====================================================================
const CHOSUNG='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
function getChosung(str){return str.split('').map(c=>{const code=c.charCodeAt(0)-0xAC00;return code>=0&&code<=11171?CHOSUNG[Math.floor(code/588)]:c}).join('')}
function isAllChosung(str){return/^[ㄱ-ㅎ]+$/.test(str)}
function fuzzyMatch(text,query){
    const t=text.toLowerCase(),q=query.toLowerCase();
    if(t.includes(q))return 100;
    // Chosung match
    if(isAllChosung(query)){const cs=getChosung(text);if(cs.includes(query))return 80}
    // Subsequence match
    let ti=0,qi=0,matched=0;
    while(ti<t.length&&qi<q.length){if(t[ti]===q[qi]){matched++;qi++}ti++}
    if(qi===q.length)return 50+Math.round((matched/t.length)*30);
    return 0;
}

// ====================================================================
//  SPOTLIGHT SEARCH
// ====================================================================
function openSpotlight(){const ov=document.getElementById('spotlight-overlay'),inp=document.getElementById('spotlight-input');ov.classList.add('open');inp.value='';inp.focus();spotlightActive=-1;renderSpotlightResults('');inp.oninput=()=>{spotlightActive=-1;renderSpotlightResults(inp.value)};inp.onkeydown=spotlightKeyHandler}
function closeSpotlight(){document.getElementById('spotlight-overlay').classList.remove('open')}
function getAllBookmarks(){const all=[];for(const[cat,items]of Object.entries(BM))(items||[]).forEach((item,idx)=>all.push({...item,category:cat,idx}));return all}
function renderSpotlightResults(query){
    const cont=document.getElementById('spotlight-results');cont.innerHTML='';const q=query.toLowerCase().trim();if(!q)return;
    const results=[];
    // A1: Commands (A2: Enhanced palette)
    const cmds=[
        {name:'할 일 추가',icon:'📋',match:['todo','할일','할 일'],action:()=>{const text=q.replace(/^>(todo|할\s?일)\s*/i,'').trim();TODOS.push({id:Date.now(),text:text||'',done:false,priority:0,dueDate:'',tags:[],subtasks:[],recurring:'',cardId:(CFG.todoCards[0]||{id:'todo_0'}).id});persistTodos();renderDashboard()}},
        {name:'타이머 시작',icon:'🍅',match:['timer','타이머','pomo'],action:()=>{const mins=parseInt(q.replace(/\D/g,''))||25;startCustomPomo(mins)}},
        {name:'편집 모드',icon:'✎',match:['edit','편집'],action:toggleEditMode},
        {name:'설정 열기',icon:'⚙',match:['settings','설정'],action:()=>{populateSettings();openModal('modal-settings')}},
        {name:'테마 전환',icon:'🌗',match:['theme','테마'],action:toggleTheme},
        {name:'내보내기',icon:'📦',match:['export','내보내기'],action:doExport},
        {name:'포커스 모드',icon:'🎯',match:['focus','포커스','집중'],action:()=>{const cat=q.replace(/^>(focus|포커스|집중)\s*/i,'').trim();if(cat&&BM[cat])toggleFocusMode(cat);else{const cats=Object.keys(BM);alert('카테고리: '+cats.join(', '))}}},
        {name:'북마크 추가',icon:'➕',match:['add','추가'],action:()=>{const rest=q.replace(/^>(add|추가)\s*/i,'').trim();const parts=rest.split(/\s+/);if(parts.length>=2){const url=parts.pop();const name=parts.join(' ');const cat=Object.keys(BM)[0]||'기본';if(!BM[cat])BM[cat]=[];BM[cat].push({name,url,addedAt:new Date().toISOString()});persistBM();renderDashboard()}}},
        {name:'습관 체크',icon:'✅',match:['habit','습관'],action:()=>{checkHabitsToday()}},
        {name:'오늘 플래너',icon:'📅',match:['today','오늘','planner'],action:()=>{openDailyPlanner()}},
        {name:'칸반 보드',icon:'📊',match:['kanban','칸반','보드'],action:()=>{openModal('modal-todo-full')}},
        {name:'레이아웃 변경',icon:'🖼',match:['layout','레이아웃'],action:()=>{cycleLayoutPreset()}}
    ];
    if(q.startsWith('>')){const cq=q.slice(1).trim().toLowerCase();cmds.filter(c=>c.match.some(m=>cq.includes(m))||c.name.includes(cq)).forEach(c=>results.push({type:'cmd',name:c.name,icon:c.icon,sub:'명령',action:c.action}))}
    // Bookmarks (fuzzy + chosung)
    getAllBookmarks().map(b=>{const score=Math.max(fuzzyMatch(b.name,q),fuzzyMatch(b.url,q),fuzzyMatch(b.category,q));return{...b,score}}).filter(b=>b.score>0).sort((a,b)=>b.score-a.score)
        .slice(0,6).forEach(b=>results.push({type:'bm',name:b.name,icon:null,iconUrl:b.icon||DEFAULT_ICONS[b.name],url:b.url,sub:b.category}));
    // Todos
    TODOS.filter(t=>t.text.toLowerCase().includes(q)).slice(0,3).forEach(t=>results.push({type:'todo',name:(t.done?'✅ ':'☐ ')+t.text,icon:'📋',sub:'할 일',action:()=>openModal('modal-todo-full')}));
    // Memos
    const allNotes=Object.values(NOTES).flat().filter(Boolean);
    allNotes.filter(n=>n.toLowerCase().includes(q)).slice(0,3).forEach(n=>results.push({type:'memo',name:n.slice(0,60),icon:'📝',sub:'메모'}));
    // D-Days
    DDAYS.filter(d=>d.label.toLowerCase().includes(q)).forEach(d=>results.push({type:'dday',name:d.label,icon:'📅',sub:d.date}));

    results.slice(0,12).forEach((r,i)=>{
        const el=document.createElement('div');el.className='spotlight-item'+(i===spotlightActive?' active':'');
        const iconDiv=document.createElement('div');iconDiv.className='spotlight-item-icon';
        if(r.icon){iconDiv.innerHTML=`<span style="font-size:1.1rem">${r.icon}</span>`}
        else if(r.iconUrl||r.url){resolveIcon(r.url||'',iconDiv,r.name,{iconPath:r.iconUrl,style:'width:60%;height:60%;object-fit:contain'})}
        else{iconDiv.innerHTML=`<span style="font-weight:600;opacity:.7">${esc(r.name.charAt(0))}</span>`}
        const nameSpan=document.createElement('span');nameSpan.className='spotlight-item-name';nameSpan.textContent=r.name;
        const catSpan=document.createElement('span');catSpan.className='spotlight-item-cat';catSpan.textContent=r.sub||'';
        el.appendChild(iconDiv);el.appendChild(nameSpan);el.appendChild(catSpan);
        el.addEventListener('click',()=>{closeSpotlight();if(r.action)r.action();else if(r.url)window.location.href=r.url});
        cont.appendChild(el)});
}
function spotlightKeyHandler(e){const items=document.querySelectorAll('.spotlight-item');if(e.key==='Escape'){closeSpotlight();return}if(e.key==='ArrowDown'){e.preventDefault();spotlightActive=Math.min(spotlightActive+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('active',i===spotlightActive))}if(e.key==='ArrowUp'){e.preventDefault();spotlightActive=Math.max(spotlightActive-1,0);items.forEach((el,i)=>el.classList.toggle('active',i===spotlightActive))}if(e.key==='Enter'&&spotlightActive>=0&&items[spotlightActive])items[spotlightActive].click()}
document.addEventListener('click',e=>{if(e.target===document.getElementById('spotlight-overlay'))closeSpotlight()});

// ====================================================================
//  UNDO SYSTEM
// ====================================================================
function showUndo(msg,restore){
    if(undoTimer)clearTimeout(undoTimer);
    // Push to undo stack (keep last 10)
    if(restore){undoStack.push(restore);if(undoStack.length>10)undoStack.shift()}
    undoData=restore;document.getElementById('undo-msg').textContent=msg;
    const toast=document.getElementById('undo-toast');toast.classList.add('visible');
    const bar=document.getElementById('undo-timer-bar');
    if(bar){bar.style.transition='none';bar.style.width='100%';requestAnimationFrame(()=>{bar.style.transition='width 5s linear';bar.style.width='0%'})}
    document.getElementById('undo-btn').style.display=restore?'':'none';
    document.getElementById('undo-btn').onclick=()=>{
        if(undoStack.length){const fn=undoStack.pop();fn();undoData=undoStack.length?undoStack[undoStack.length-1]:null}
        toast.classList.remove('visible');clearTimeout(undoTimer);
    };
    undoTimer=setTimeout(()=>{toast.classList.remove('visible');undoData=null},5000);
}

// ====================================================================
//  ADD CATEGORY BUTTON
// ====================================================================
function createAddCardPlaceholder(section){
    const card=document.createElement('div');card.className='card-common add-card-placeholder';
    if(section==='bottom')card.classList.add('card-tall');

    const idle=document.createElement('div');idle.className='acp-idle';
    idle.innerHTML='<div class="acp-icon">+</div><div class="acp-label">카드 추가</div>';
    card.appendChild(idle);

    const expanded=document.createElement('div');expanded.className='acp-expanded';expanded.style.display='none';

    // Type buttons (built dynamically)
    const types=document.createElement('div');types.className='acp-types';
    expanded.appendChild(types);

    // Name input (for cat/memo only)
    const input=document.createElement('input');input.type='text';input.className='acp-input';
    input.placeholder='이름 입력 후 Enter...';input.autocomplete='off';input.style.display='none';
    expanded.appendChild(input);
    card.appendChild(expanded);

    let selectedType='cat';

    function buildTypes(){
        types.innerHTML='';
        const opts=[{type:'cat',icon:'📂',label:'카테고리'}];
        if(section==='bottom'){
            opts.push({type:'memo',icon:'📝',label:'메모장'});
            opts.push({type:'todo',icon:'📋',label:'할 일'});
            if(!CFG.showTodo)opts.push({type:'todo-restore',icon:'📋',label:'할 일 전체 표시'});
            if(!CFG.showCalendar)opts.push({type:'calendar',icon:'📅',label:'달력'});
            if(!CFG.showHabit)opts.push({type:'habit',icon:'🎯',label:'습관'});
        }
        opts.forEach(opt=>{
            const btn=document.createElement('button');btn.className='acp-type-btn';btn.dataset.type=opt.type;
            btn.innerHTML=`<span class="acp-type-icon">${opt.icon}</span>${opt.label}`;
            btn.addEventListener('click',()=>{
                selectedType=btn.dataset.type;
                types.querySelectorAll('.acp-type-btn').forEach(b=>b.classList.remove('selected'));
                btn.classList.add('selected');
                // Widget types don't need name input - just create immediately
                if(['todo-restore','calendar','habit'].includes(selectedType)){
                    if(selectedType==='todo-restore'){CFG.showTodo=true}
                    else if(selectedType==='calendar'){CFG.showCalendar=true}
                    else if(selectedType==='habit'){CFG.showHabit=true}
                    persistConfig();renderDashboard();
                    const names={'todo-restore':'할 일',calendar:'달력',habit:'습관'};
                    showUndo(`"${names[selectedType]}" 카드 추가됨`,null);
                } else if(selectedType==='todo'){
                    // Need name input for new todo card
                    input.style.display='block';
                    input.placeholder='할 일 카드 이름...';
                    input.focus();
                } else {
                    input.style.display='block';
                    input.placeholder=selectedType==='memo'?'메모장 이름...':'카테고리 이름...';
                    input.focus();
                }
            });
            types.appendChild(btn);
        });
    }

    idle.addEventListener('click',()=>{
        buildTypes();idle.style.display='none';expanded.style.display='flex';card.classList.add('acp-active');
        const btns=types.querySelectorAll('.acp-type-btn');
        if(btns.length===1){btns[0].click()}
    });

    input.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
            const name=input.value.trim();
            if(selectedType==='cat'){
                if(!name)return;
                if(BM[name])return showUndo('이미 존재하는 카테고리입니다',null);
                BM[name]=[];const p=curPage();(section==='top'?p.topCategories:p.bottomCategories).push(name);
                persistBM();persistConfig();renderDashboard();
                showUndo(`"${name}" 카테고리 생성됨`,null);
            } else if(selectedType==='memo'){
                const memoName=name||('메모장 '+(CFG.memoCards.length+1));
                const id='memo_'+Date.now();CFG.memoCards.push({id,title:memoName,lines:CFG.linesPerNotepad||6});
                NOTES[id]=[];for(let j=0;j<(CFG.linesPerNotepad||6);j++)NOTES[id].push('');
                persistConfig();persistNotes();renderDashboard();
                showUndo(`"${memoName}" 메모장 생성됨`,null);
            } else if(selectedType==='todo'){
                const todoName=name||('할 일 '+(CFG.todoCards.length+1));
                const id='todo_'+Date.now();CFG.todoCards.push({id,title:todoName});
                CFG.showTodo=true;persistConfig();renderDashboard();
                showUndo(`"${todoName}" 할 일 카드 생성됨`,null);
            }
        }
        if(e.key==='Escape'){resetPlaceholder()}
    });

    const resetPlaceholder=()=>{
        idle.style.display='';expanded.style.display='none';card.classList.remove('acp-active');
        input.value='';input.style.display='none';
    };
    card.addEventListener('focusout',e=>{
        setTimeout(()=>{if(!card.contains(document.activeElement))resetPlaceholder()},150);
    });

    return card;
}

// ====================================================================
//  EDIT MODE
// ====================================================================
function initEditMode(){
    document.getElementById('btn-edit-mode').addEventListener('click',toggleEditMode);
    document.addEventListener('click',e=>{
        const ab=e.target.closest('[data-action]');if(!ab)return;
        const action=ab.dataset.action,cat=ab.dataset.cat;
        if(action==='add-bm')openBMModal('add',cat);
        else if(action==='del-cat'){if(confirm(`"${cat}" 카테고리와 북마크를 전부 삭제할까요?`)){
            const backup={bm:JSON.parse(JSON.stringify(BM[cat]||[])),cat,page:JSON.parse(JSON.stringify(curPage()))};
            deleteCat(cat);showUndo(`"${cat}" 삭제됨`,()=>{BM[cat]=backup.bm;const p=curPage();p.topCategories=backup.page.topCategories;p.bottomCategories=backup.page.bottomCategories;persistBM();persistConfig();renderDashboard()})}}
        else if(action==='move-cat-page'){showMoveCatPagePopup(cat,ab)}
        else if(action==='resize'){const cur=parseInt(CFG.cardSizes[cat])||1;CFG.cardSizes[cat]=cur>=4?1:cur+1;persistConfig();renderDashboard()}
        else if(action==='rename-cat'){document.getElementById('rename-cat-input').value=cat;document.getElementById('rename-cat-input').dataset.oldName=cat;openModal('modal-rename-cat')}
    });
}
function toggleEditMode(){editMode=!editMode;document.body.classList.toggle('edit-mode',editMode);renderPageTabs()}

// ====================================================================
//  MOVE CATEGORY TO ANOTHER PAGE
// ====================================================================
function showMoveCatPagePopup(cat,anchor){
    const existing=document.querySelector('.move-page-popup');if(existing)existing.remove();
    if(CFG.pages.length<2){showUndo('페이지가 1개뿐입니다. 설정에서 페이지를 추가하세요.',null);return}
    const popup=document.createElement('div');popup.className='move-page-popup';
    // Find which page currently owns this category
    let srcPageIdx=-1;
    CFG.pages.forEach((pg,i)=>{if([...(pg.topCategories||[]),...(pg.bottomCategories||[])].includes(cat))srcPageIdx=i});
    popup.innerHTML=`<div class="mpp-title">"${esc(cat)}" 이동</div>`;
    CFG.pages.forEach((pg,i)=>{
        if(i===srcPageIdx)return; // skip current page
        const btn=document.createElement('button');btn.className='mpp-btn';
        btn.textContent=pg.name;
        btn.addEventListener('click',()=>{
            moveCatToPage(cat,srcPageIdx,i);
            popup.remove();
        });
        popup.appendChild(btn);
    });
    document.body.appendChild(popup);
    const r=anchor.getBoundingClientRect();
    popup.style.left=Math.min(r.left,window.innerWidth-160)+'px';
    popup.style.top=(r.bottom+4)+'px';
    setTimeout(()=>document.addEventListener('click',()=>popup.remove(),{once:true}),10);
}
function moveCatToPage(cat,fromIdx,toIdx){
    const from=CFG.pages[fromIdx];const to=CFG.pages[toIdx];
    // Determine section (top or bottom)
    let section='top';
    if(from.topCategories?.includes(cat)){from.topCategories=from.topCategories.filter(c=>c!==cat);section='top'}
    else if(from.bottomCategories?.includes(cat)){from.bottomCategories=from.bottomCategories.filter(c=>c!==cat);section='bottom'}
    // Add to target page same section
    if(section==='top'){if(!to.topCategories)to.topCategories=[];to.topCategories.push(cat)}
    else{if(!to.bottomCategories)to.bottomCategories=[];to.bottomCategories.push(cat)}
    persistConfig();renderDashboard();
    showUndo(`"${cat}" → "${to.name}" 이동됨`,()=>{
        // Undo: move back
        if(section==='top'){to.topCategories=(to.topCategories||[]).filter(c=>c!==cat);if(!from.topCategories)from.topCategories=[];from.topCategories.push(cat)}
        else{to.bottomCategories=(to.bottomCategories||[]).filter(c=>c!==cat);if(!from.bottomCategories)from.bottomCategories=[];from.bottomCategories.push(cat)}
        persistConfig();renderDashboard();
    });
}

// ====================================================================
//  BOOKMARK CRUD + URL DUPE CHECK + ICON UPLOAD
// ====================================================================
function openBMModal(mode,cat,idx){
    const t=document.getElementById('bm-modal-title'),nm=document.getElementById('bm-name'),ur=document.getElementById('bm-url'),ct=document.getElementById('bm-category'),ic=document.getElementById('bm-icon'),del=document.getElementById('btn-bm-delete');
    ct.innerHTML='';
    // Show ALL categories from ALL pages, grouped by page name
    CFG.pages.forEach((pg,pi)=>{
        const group=document.createElement('optgroup');group.label=pg.name;
        [...(pg.topCategories||[]),...(pg.bottomCategories||[])].forEach(c=>{if(BM[c]!==undefined)group.appendChild(new Option(c,c))});
        if(group.children.length)ct.appendChild(group);
    });
    if(mode==='edit'){const item=BM[cat][idx];t.textContent='북마크 편집';nm.value=item.name;ur.value=item.url;ct.value=cat;ic.value=item.icon||'';del.style.display='block';editTarget={cat,idx}}
    else{t.textContent='북마크 추가';nm.value='';ur.value='';ur.placeholder='https://example.com';ct.value=cat;ic.value='';del.style.display='none';editTarget=null}
    openModal('modal-bookmark');setTimeout(()=>nm.focus(),100);
}
// http(s)/ftp(s)/mailto covers every legitimate bookmark — this only blocks
// javascript:/data:/vbscript: etc., which aren't real bookmarks but script-execution
// payloads that would run when the card is clicked (createBookmarkEl sets link.href
// directly to item.url). Doesn't reduce real freedom to add/move/edit/remove URLs.
const BOOKMARK_URL_ALLOWED_PROTOCOLS=['http:','https:','ftp:','ftps:','mailto:'];
function isValidBookmarkUrl(url){
    try{return BOOKMARK_URL_ALLOWED_PROTOCOLS.includes(new URL(url).protocol)}catch{return false}
}
function saveBM(){
    const name=document.getElementById('bm-name').value.trim(),url=document.getElementById('bm-url').value.trim(),cat=document.getElementById('bm-category').value,icon=document.getElementById('bm-icon').value.trim();
    if(!name||!url)return alert('이름과 URL을 입력해주세요.');
    if(!isValidBookmarkUrl(url))return alert('올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작하는 주소를 입력해주세요.');
    // URL dupe check — exclude the item currently being edited by its actual position
    // (category+index), not by name(2026-08-20 fix: comparing by name incorrectly matched
    // *any* same-named bookmark in a different category, letting real duplicates slip
    // through unwarned when two unrelated bookmarks happened to share a name).
    const isEdit=!!editTarget;const allItems=getAllBookmarks();
    const dupe=allItems.find(b=>b.url===url&&!(isEdit&&b.category===editTarget.cat&&b.idx===editTarget.idx));
    if(dupe&&!confirm(`"${dupe.name}" (${dupe.category})에 같은 URL이 있습니다. 계속 추가할까요?`))return;
    const item={name,url};if(icon)item.icon=icon;
    if(isEdit){const{cat:old,idx}=editTarget;if(old===cat)BM[cat][idx]=item;else{BM[old].splice(idx,1);if(!BM[cat])BM[cat]=[];item.addedAt=new Date().toISOString();BM[cat].push(item)}}
    else{if(!BM[cat])BM[cat]=[];item.addedAt=new Date().toISOString();BM[cat].push(item)}
    persistBM();closeModal('modal-bookmark');renderDashboard();
}
function deleteBM(){
    if(!editTarget)return;const{cat,idx}=editTarget;const item=BM[cat][idx];
    // Move to trash
    TRASH.push({...item,category:cat,deletedAt:new Date().toISOString()});persistTrash();
    const backup={item:JSON.parse(JSON.stringify(item)),cat,idx};
    BM[cat].splice(idx,1);persistBM();closeModal('modal-bookmark');renderDashboard();
    showUndo(`"${item.name}" 삭제됨`,()=>{BM[backup.cat].splice(backup.idx,0,backup.item);TRASH.pop();persistBM();persistTrash();renderDashboard()});
}
function deleteCat(cat){delete BM[cat];const p=curPage();p.topCategories=(p.topCategories||[]).filter(c=>c!==cat);p.bottomCategories=(p.bottomCategories||[]).filter(c=>c!==cat);persistBM();persistConfig();renderDashboard()}
function createCat(){
    const name=document.getElementById('cat-name').value.trim(),pos=document.getElementById('cat-position').value;
    if(!name)return alert('이름을 입력하세요.');if(BM[name])return alert('이미 존재합니다.');
    BM[name]=[];const p=curPage();(pos==='top'?p.topCategories:p.bottomCategories).push(name);
    persistBM();persistConfig();closeModal('modal-category');renderDashboard();
}
function renameCat(){
    const oldName=document.getElementById('rename-cat-input').dataset.oldName;
    const newName=document.getElementById('rename-cat-input').value.trim();
    if(!newName)return alert('이름을 입력하세요.');if(newName===oldName){closeModal('modal-rename-cat');return}
    if(BM[newName])return alert('이미 존재하는 이름입니다.');
    BM[newName]=BM[oldName];delete BM[oldName];
    CFG.pages.forEach(p=>{p.topCategories=p.topCategories.map(c=>c===oldName?newName:c);p.bottomCategories=p.bottomCategories.map(c=>c===oldName?newName:c)});
    if(CFG.cardSizes[oldName]){CFG.cardSizes[newName]=CFG.cardSizes[oldName];delete CFG.cardSizes[oldName]}
    CFG.collapsedCategories=CFG.collapsedCategories.map(c=>c===oldName?newName:c);
    persistBM();persistConfig();closeModal('modal-rename-cat');renderDashboard();
}

// Icon upload handler
document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('btn-bm-icon-upload')?.addEventListener('click',()=>document.getElementById('bm-icon-upload').click());
    document.getElementById('bm-icon-upload')?.addEventListener('change',async e=>{
        const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append('icon',f);
        try{const r=await fetch('/api/upload-icon',{method:'POST',body:fd});const d=await r.json();
            if(d.success)document.getElementById('bm-icon').value=d.path}catch{alert('업로드 실패')}
    });
    document.getElementById('btn-rename-cat-save')?.addEventListener('click',renameCat);
});

// ====================================================================
//  SETTINGS UI
// ====================================================================
function initSettingsUI(){
    document.getElementById('btn-settings').addEventListener('click',()=>{
        const si=document.getElementById('settings-search');if(si)si.value='';
        document.querySelectorAll('.setting-group').forEach(g=>g.classList.remove('hidden'));
        populateSettings();openModal('modal-settings')});
    document.querySelectorAll('.stab').forEach(tab=>tab.addEventListener('click',()=>{
        document.querySelectorAll('.stab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.stab-content').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');document.getElementById(tab.dataset.tab)?.classList.add('active')}));

    // Live preview for opacity
    document.getElementById('bg-opacity').addEventListener('input',e=>{document.getElementById('bg-overlay').style.background=`rgba(0,0,0,${parseInt(e.target.value)/100})`});
    // Live preview for time overlay
    document.getElementById('chk-time-overlay').addEventListener('change',e=>{CFG.timeBasedOverlay=e.target.checked;updateTimeOverlay()});
    // Live preview for custom CSS
    document.getElementById('custom-css').addEventListener('input',e=>{CFG.customCSS=e.target.value;applyCustomCSS()});
    // Live preview for layout preset
    document.getElementById('layout-preset')?.addEventListener('change',e=>{CFG.layoutPreset=e.target.value;applyLayoutPreset()});
    // Live preview for theme mode
    document.getElementById('theme-mode-select')?.addEventListener('change',e=>{CFG.themeMode=e.target.value;initAutoTheme()});
    // B2: Blur live preview
    document.getElementById('blur-intensity')?.addEventListener('input',e=>{CFG.blurIntensity=parseInt(e.target.value);applyBlur()});
    // B7: Glass preset live preview
    document.getElementById('glass-preset')?.addEventListener('change',e=>{
        CFG.glassPreset=e.target.value;
        // Sync opacity slider to preset
        const presetOpacities={clear:5,normal:50,frosted:90};
        CFG.cardOpacity=presetOpacities[e.target.value]??50;
        const coEl=document.getElementById('card-opacity');if(coEl){coEl.value=CFG.cardOpacity;document.getElementById('card-opacity-val').textContent=CFG.cardOpacity+'%'}
        applyGlassPreset();
    });
    document.getElementById('card-opacity')?.addEventListener('input',e=>{CFG.cardOpacity=parseInt(e.target.value);document.getElementById('card-opacity-val').textContent=CFG.cardOpacity+'%';applyOpacitySettings()});
    document.getElementById('clock-opacity')?.addEventListener('input',e=>{CFG.clockOpacity=parseInt(e.target.value);document.getElementById('clock-opacity-val').textContent=CFG.clockOpacity+'%';applyOpacitySettings()});

    // === Unified Background Management ===
    const bgI=document.getElementById('bg-upload');
    document.getElementById('btn-bg-upload').addEventListener('click',()=>bgI.click());
    bgI.addEventListener('change',async()=>{
        for(const f of bgI.files){
            const fd=new FormData();fd.append('background',f);
            try{
                const r=await fetch('/api/upload-background?slideshow=true',{method:'POST',body:fd});
                const d=await r.json();
                if(d.success){
                    if(!CFG.backgrounds)CFG.backgrounds=[];
                    CFG.backgrounds.push(d.path);
                    // First image also becomes the active background
                    if(CFG.backgrounds.length===1){
                        CFG.backgroundImage=d.path;
                        document.getElementById('bg-image').src=d.path;
                    }
                }
            }catch{alert('업로드 실패')}
        }
        persistConfig();populateBgThumbs();initSlideshow();
        bgI.value='';
    });
    document.getElementById('btn-bg-reset').addEventListener('click',()=>{
        if(!confirm('모든 배경 이미지를 초기화할까요?'))return;
        CFG.backgrounds=[];CFG.backgroundImage='assets/background.png';
        document.getElementById('bg-image').src='assets/background.png';
        if(slideshowTimer){clearInterval(slideshowTimer);slideshowTimer=null}
        persistConfig();populateBgThumbs();
    });
    // Slideshow ON/OFF toggle
    document.getElementById('chk-slideshow-enabled')?.addEventListener('change',e=>{
        CFG.slideshowEnabled=e.target.checked;
        // Show/hide interval row based on toggle
        const intRow=document.getElementById('bg-interval-row');
        if(intRow)intRow.style.display=e.target.checked?'':'none';
        persistConfig();initSlideshow();
    });
    // Interval select
    document.getElementById('bg-interval-select')?.addEventListener('change',e=>{
        CFG.bgIntervalMinutes=parseInt(e.target.value)||10;
        persistConfig();initSlideshow();
    });
    // Manual prev/next background buttons
    document.getElementById('btn-bg-prev')?.addEventListener('click',()=>{slideshowGoTo(_bgIdx-1)});
    document.getElementById('btn-bg-next')?.addEventListener('click',()=>{slideshowGoTo(_bgIdx+1)});

    document.getElementById('btn-add-clock').addEventListener('click',()=>{CFG.clocks.push({label:'새 시계',timezone:'UTC'});populateClockSettings()});
    document.getElementById('btn-add-engine').addEventListener('click',()=>{CFG.searchEngines.push({name:'New',url:'https://example.com/search?q=',icon:'https://example.com/favicon.ico'});populateEngineSettings()});
    document.getElementById('btn-add-dday').addEventListener('click',()=>{DDAYS.push({id:Date.now(),label:'새 이벤트',date:new Date().toISOString().slice(0,10)});populateDDaySettings()});
    document.getElementById('btn-add-page').addEventListener('click',()=>{CFG.pages.push({name:'새 페이지',topCategories:[],bottomCategories:[]});populatePageSettings()});
    document.getElementById('btn-save-settings').addEventListener('click',saveAllSettings);
    document.getElementById('btn-bm-save').addEventListener('click',saveBM);
    document.getElementById('btn-bm-delete').addEventListener('click',deleteBM);
    document.getElementById('btn-cat-save').addEventListener('click',createCat);
    document.getElementById('btn-export').addEventListener('click',doExport);
    document.getElementById('backup-interval').addEventListener('input',updateBackupIntervalHint);
    const impI=document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click',()=>impI.click());
    impI.addEventListener('change',doImport);
    document.getElementById('btn-find-dupes').addEventListener('click',findDuplicateBookmarks);
    document.getElementById('btn-reset-deadlinks').addEventListener('click',()=>{
        const cnt=Object.keys(CFG.deadLinks).length;
        if(!cnt){alert('현재 데드링크로 표시된 항목이 없습니다.');return}
        if(confirm(`데드링크 ${cnt}개를 모두 초기화합니다.\n다음 검사에서 다시 확인됩니다.`)){
            CFG.deadLinks={};CFG._deadLinkFails={};persistConfig();renderDashboard();
            alert('✅ 데드링크가 초기화되었습니다.');
        }
    });
    // Backup list & restore UI
    document.getElementById('btn-show-backups')?.addEventListener('click',async()=>{
        const listEl=document.getElementById('backup-list');
        const btn=document.getElementById('btn-show-backups');
        if(listEl.style.display!=='none'){listEl.style.display='none';btn.textContent='백업 목록 보기';return}
        btn.textContent='로딩 중...';
        try{
            const r=await fetch('/api/backups');const data=await r.json();
            const backups=data.backups||[];
            if(!backups.length){listEl.innerHTML='<p style="font-size:.72rem;color:var(--text-muted)">백업 파일이 없습니다</p>';listEl.style.display='block';btn.textContent='백업 목록 닫기';return}
            listEl.innerHTML=backups.map(b=>{
                const date=b.date?new Date(b.date).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
                const size=b.size?(b.size/1024).toFixed(1)+'KB':'';
                return `<div class="backup-row" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--glass-border);font-size:.72rem">
                    <span style="flex:1;color:var(--text-secondary)">${date}</span>
                    <span style="color:var(--text-muted)">${size}</span>
                    <button class="btn btn-ghost btn-sm backup-restore-btn" data-name="${esc(b.name)}" style="font-size:.68rem;padding:2px 8px">복원</button>
                </div>`}).join('');
            listEl.style.display='block';btn.textContent='백업 목록 닫기';
            listEl.querySelectorAll('.backup-restore-btn').forEach(rb=>rb.addEventListener('click',async()=>{
                const name=rb.dataset.name;
                if(!confirm(`이 백업으로 복원합니다.\n\n현재 데이터의 안전 백업이 먼저 생성됩니다.\n계속하시겠습니까?`))return;
                rb.textContent='복원 중...';rb.disabled=true;
                try{
                    const rr=await fetch('/api/backups/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
                    if(rr.ok){
                        const rd=await rr.json();
                        const dropMsg=rd.bookmarksDroppedCount>0?`\n\n(URL 형식이 잘못된 북마크 ${rd.bookmarksDroppedCount}개는 건너뜀)`:'';
                        alert('✅ 백업에서 복원되었습니다.'+dropMsg+' 페이지를 새로고침합니다.');location.reload()
                    }
                    else{const err=await rr.json();alert('복원 실패: '+(err.error||'알 수 없는 오류'))}
                }catch(e){alert('복원 실패: '+e.message)}
                rb.textContent='복원';rb.disabled=false;
            }));
        }catch{listEl.innerHTML='<p style="font-size:.72rem;color:var(--danger)">서버에 연결할 수 없습니다</p>';listEl.style.display='block';btn.textContent='백업 목록 닫기'}
    });
    document.getElementById('btn-open-shortcuts').addEventListener('click',()=>{closeModal('modal-settings');setTimeout(()=>openModal('modal-shortcuts'),250)});
    document.getElementById('btn-add-shortcut').addEventListener('click',()=>{CFG.shortcuts.push({key:'',action:'',label:''});populateShortcutSettings()});
    document.getElementById('btn-save-shortcuts').addEventListener('click',saveShortcuts);
    document.getElementById('btn-profile-save').addEventListener('click',saveProfile);
    document.getElementById('btn-empty-trash')?.addEventListener('click',()=>{if(!TRASH.length)return;if(!confirm('휴지통을 비울까요? 복원할 수 없습니다.')){return}TRASH=[];persistTrash();populateTrash()});

    // === Server Management ===
    document.getElementById('btn-change-port')?.addEventListener('click',async()=>{
        const input=document.getElementById('server-port-input');
        const port=parseInt(input.value);
        if(!port||port<1024||port>65535){alert('포트 번호는 1024~65535 사이여야 합니다.');return}
        try{
            const r=await fetch('/api/port',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port})});
            const d=await r.json();
            if(d.success){
                document.getElementById('server-port-info').textContent='✅ 포트가 '+port+'로 저장되었습니다. 서버를 재시작하면 적용됩니다.';
                if(confirm('포트가 '+port+'로 변경되었습니다.\n지금 서버를 재시작할까요?\n\n재시작 후 자동으로 새 주소로 이동합니다.')){
                    doServerRestart(port);
                }
            }else{alert('오류: '+d.error)}
        }catch(e){alert('서버 연결 실패')}
    });
    document.getElementById('btn-restart-server')?.addEventListener('click',()=>{
        if(!confirm('서버를 재시작할까요?\n잠시 후 자동으로 새로고침됩니다.')){return}
        doServerRestart();
    });
}

async function doServerRestart(newPort){
    try{
        await fetch('/api/restart',{method:'POST'});
    }catch{}
    // Show loading message
    document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;font-family:sans-serif;flex-direction:column"><h2>🔄 서버 재시작 중...</h2><p style="color:#888;margin-top:8px">잠시만 기다려주세요</p></div>';
    // Wait and retry connection
    const targetPort=newPort||location.port||1111;
    const targetUrl=location.protocol+'//'+location.hostname+':'+targetPort+'/';
    let retries=0;
    const check=setInterval(async()=>{
        retries++;
        try{
            const r=await fetch(targetUrl+'api/health',{signal:AbortSignal.timeout(2000)});
            if(r.ok){clearInterval(check);location.href=targetUrl}
        }catch{}
        if(retries>15){clearInterval(check);document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;font-family:sans-serif;flex-direction:column"><h2>⚠ 서버에 연결할 수 없습니다</h2><p style="color:#888;margin-top:8px">'+targetUrl+' 로 직접 접속하거나 restart.bat을 실행해주세요</p></div>'}
    },2000);
}

function populateSettings(){
    // Backup status display
    fetch('/api/backups').then(r=>r.json()).then(data=>{
        const el=document.getElementById('backup-status');if(!el)return;
        const backups=data.backups||[];
        if(!backups.length){el.textContent='백업 없음';return}
        const latest=backups[0];
        const date=latest.date?new Date(latest.date).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'알 수 없음';
        const ago=latest.date?Math.round((Date.now()-new Date(latest.date).getTime())/3600000):0;
        const agoText=ago<1?'방금 전':ago<24?ago+'시간 전':Math.round(ago/24)+'일 전';
        // 2026-08-20 UX 개선: "다음 백업이 언제인지 안 보임" 지적 — 서버가 실제로 예약해둔
        // 정확한 시각을 클라이언트가 알 방법은 없지만(메모리상 타이머라 조회 API가 없음),
        // 마지막 백업 시각 + 현재 설정된 간격으로 추정치를 보여준다(정확한 예약이 아니라
        // "대략"임을 명시해 과대 고지하지 않는다).
        let nextText='';
        if(latest.date){
            const intervalMs=(CFG.backupIntervalHours||24)*3600000;
            const nextAt=new Date(latest.date).getTime()+intervalMs;
            const remainMs=nextAt-Date.now();
            if(remainMs<=0)nextText=' · 다음 백업 대기 중';
            else{const remainH=Math.round(remainMs/3600000);nextText=` · 다음 백업(대략): ${remainH<1?'1시간 이내':remainH+'시간 후'}`}
        }
        el.textContent=`마지막 백업: ${agoText} (${date}) / 총 ${backups.length}개${nextText}`;
    }).catch(()=>{const el=document.getElementById('backup-status');if(el)el.textContent='백업 상태를 확인할 수 없습니다'});
    document.getElementById('bg-opacity').value=CFG.backgroundOverlayOpacity||15;
    document.getElementById('chk-time-overlay').checked=!!CFG.timeBasedOverlay;
    document.getElementById('chk-usage-tracking').checked=CFG.usageTracking!==false;
    document.getElementById('chk-show-recommendations').checked=!!CFG.showRecommendations;
    // Unified background + slideshow controls
    const bgCount=(CFG.backgrounds?.length||0);
    const bgIntEl=document.getElementById('bg-interval-select');if(bgIntEl)bgIntEl.value=String(CFG.bgIntervalMinutes||10);
    // Show slideshow controls only when 2+ images
    const ssControls=document.getElementById('bg-slideshow-controls');
    if(ssControls)ssControls.style.display=bgCount>=2?'':'none';
    const ssToggle=document.getElementById('chk-slideshow-enabled');
    if(ssToggle)ssToggle.checked=CFG.slideshowEnabled!==false;
    // Show interval row only when slideshow is ON
    const bgIntRow=document.getElementById('bg-interval-row');
    if(bgIntRow)bgIntRow.style.display=(bgCount>=2&&CFG.slideshowEnabled!==false)?'':'none';
    // Update current index display
    updateBgCurrentIdx();
    populateBgThumbs();
    document.getElementById('custom-css').value=CFG.customCSS||'';
    document.getElementById('backup-interval').value=CFG.backupIntervalHours||24;
    updateBackupIntervalHint();
    document.getElementById('weather-key-input').value=CFG.weatherApiKey||'';
    document.getElementById('weather-city-input').value=CFG.weatherCity||'Seoul';
    document.getElementById('weather-units-input').value=CFG.weatherUnits||'metric';
    document.getElementById('theme-mode-select').value=CFG.themeMode||'manual';
    document.getElementById('chk-cal-monday').checked=CFG.calendarStartMonday!==false;
    const blurEl=document.getElementById('blur-intensity');if(blurEl)blurEl.value=CFG.blurIntensity||18;
    const glassEl=document.getElementById('glass-preset');if(glassEl)glassEl.value=CFG.glassPreset||'normal';
    const coEl=document.getElementById('card-opacity');if(coEl){coEl.value=CFG.cardOpacity??50;document.getElementById('card-opacity-val').textContent=(CFG.cardOpacity??50)+'%'}
    const ckEl=document.getElementById('clock-opacity');if(ckEl){ckEl.value=CFG.clockOpacity??22;document.getElementById('clock-opacity-val').textContent=(CFG.clockOpacity??22)+'%'}
    const sortEl=document.getElementById('chk-auto-sort');if(sortEl)sortEl.checked=!!CFG.autoSortByUsage;
    const listEl=document.getElementById('chk-list-view');if(listEl)listEl.checked=!!CFG.listView;
    const motionEl=document.getElementById('chk-reduce-motion');if(motionEl)motionEl.checked=!!CFG.reduceMotion;
    // v7.0
    const autoPomoEl=document.getElementById('chk-auto-pomo');if(autoPomoEl)autoPomoEl.checked=!!CFG.pomoAutoSession;
    const notifEl=document.getElementById('chk-event-notif');if(notifEl)notifEl.checked=CFG.eventNotifications!==false;
    const layoutEl=document.getElementById('layout-preset');if(layoutEl)layoutEl.value=CFG.layoutPreset||'default';
    const kwEl=document.getElementById('search-keywords');if(kwEl)kwEl.value=Object.entries(CFG.searchKeywords||{}).map(([k,v])=>k+'='+v).join('\n');
    const habEl=document.getElementById('habits-input');if(habEl)habEl.value=(CFG.habits||[]).join('\n');
    populateClockSettings();populateEngineSettings();populateDDaySettings();populateCardSizeSettings();populateBgThumbs();populateProfileList();populatePageSettings();populateStats();populateTrash();populateCardColorSettings();populateAccentPicker();
    // Server port info
    fetch('/api/port').then(r=>r.json()).then(d=>{
        const input=document.getElementById('server-port-input');if(input)input.value=d.currentPort;
        const info=document.getElementById('server-port-info');if(info)info.textContent='현재 포트: '+d.currentPort;
    }).catch(()=>{});
}

function populateClockSettings(){const c=document.getElementById('clock-settings');c.innerHTML='';
    (CFG.clocks||[]).forEach((ck,i)=>{const r=document.createElement('div');r.className='clock-setting-row';
        r.innerHTML=`<input type="text" value="${esc(ck.label)}" placeholder="표시명" data-clock-label="${i}" class="setting-input" style="max-width:100px"><input type="text" value="${esc(ck.timezone)}" placeholder="Asia/Seoul" data-clock-tz="${i}" class="setting-input"><button class="btn-icon-sm" data-rm-clock="${i}">×</button>`;c.appendChild(r)});
    c.querySelectorAll('[data-rm-clock]').forEach(b=>b.addEventListener('click',()=>{CFG.clocks.splice(parseInt(b.dataset.rmClock),1);populateClockSettings()}))}

function populateEngineSettings(){const c=document.getElementById('engine-settings');c.innerHTML='';
    (CFG.searchEngines||[]).forEach((en,i)=>{const r=document.createElement('div');r.className='engine-setting-row';
        r.innerHTML=`<input type="text" value="${esc(en.name)}" placeholder="이름" data-eng-name="${i}" class="setting-input" style="max-width:80px"><input type="text" value="${esc(en.url)}" placeholder="검색 URL (?q=)" data-eng-url="${i}" class="setting-input"><input type="text" value="${esc(en.icon)}" placeholder="아이콘 URL" data-eng-icon="${i}" class="setting-input" style="max-width:120px"><button class="btn-icon-sm" data-rm-eng="${i}">×</button>`;c.appendChild(r)});
    c.querySelectorAll('[data-rm-eng]').forEach(b=>b.addEventListener('click',()=>{CFG.searchEngines.splice(parseInt(b.dataset.rmEng),1);populateEngineSettings()}))}

function populateDDaySettings(){const c=document.getElementById('dday-settings');c.innerHTML='';
    DDAYS.forEach((dd,i)=>{const r=document.createElement('div');r.className='dday-setting-row';
        r.innerHTML=`<input type="text" value="${esc(dd.label)}" placeholder="이벤트명" data-dd-label="${i}" class="setting-input" style="max-width:120px"><input type="date" value="${esc(dd.date)}" data-dd-date="${i}" class="setting-input" style="max-width:160px"><button class="btn-icon-sm" data-rm-dd="${i}">×</button>`;c.appendChild(r)});
    c.querySelectorAll('[data-rm-dd]').forEach(b=>b.addEventListener('click',()=>{DDAYS.splice(parseInt(b.dataset.rmDd),1);populateDDaySettings()}))}

function populateCardSizeSettings(){const c=document.getElementById('card-size-settings');c.innerHTML='';const p=curPage();
    [...(p.topCategories||[]),...(p.bottomCategories||[])].forEach(cat=>{if(!BM[cat])return;const r=document.createElement('div');r.className='card-size-row';
        const curSize=parseInt(CFG.cardSizes[cat])||1;
        r.innerHTML=`<span>${esc(cat)}</span><select class="setting-input" data-cs-cat="${esc(cat)}" style="max-width:80px"><option value="1"${curSize===1?' selected':''}>1칸</option><option value="2"${curSize===2?' selected':''}>2칸</option><option value="3"${curSize===3?' selected':''}>3칸</option><option value="4"${curSize===4?' selected':''}>4칸</option></select>`;c.appendChild(r)})}

function populateBgThumbs(){
    const c=document.getElementById('bg-thumbs');if(!c)return;c.innerHTML='';
    const bgs=CFG.backgrounds||[];
    const countEl=document.getElementById('bg-count');
    if(countEl){
        if(bgs.length===0)countEl.textContent='0장';
        else if(bgs.length===1)countEl.textContent='1장 (고정 배경)';
        else countEl.textContent=bgs.length+'장'+(CFG.slideshowEnabled?' (슬라이드쇼 ON)':' (슬라이드쇼 OFF)');
    }
    // Show/hide slideshow controls based on count
    const ssControls=document.getElementById('bg-slideshow-controls');
    if(ssControls)ssControls.style.display=bgs.length>=2?'':'none';
    const intRow=document.getElementById('bg-interval-row');
    if(intRow)intRow.style.display=(bgs.length>=2&&CFG.slideshowEnabled)?'':'none';
    updateBgCurrentIdx();
    bgs.forEach((img,i)=>{
        const w=document.createElement('div');w.className='slide-thumb-wrap';
        const isActive=(i===0&&bgs.length===1)||(i===_bgIdx&&bgs.length>1);
        w.innerHTML=`<img src="${esc(img)}" class="slide-thumb${isActive?' active-bg':''}"><div class="bg-thumb-btns">${i>0?`<button class="slide-thumb-btn" data-bg-up="${i}" title="앞으로">◀</button>`:''}${i<bgs.length-1?`<button class="slide-thumb-btn" data-bg-down="${i}" title="뒤로">▶</button>`:''}<button class="slide-thumb-rm" data-rm-bg="${i}" title="삭제">×</button></div>`;
        c.appendChild(w);
    });
    // Reorder buttons
    c.querySelectorAll('[data-bg-up]').forEach(b=>b.addEventListener('click',()=>{
        const i=parseInt(b.dataset.bgUp);if(i<1)return;
        [bgs[i-1],bgs[i]]=[bgs[i],bgs[i-1]];
        persistConfig();populateBgThumbs();initBackground();
    }));
    c.querySelectorAll('[data-bg-down]').forEach(b=>b.addEventListener('click',()=>{
        const i=parseInt(b.dataset.bgDown);if(i>=bgs.length-1)return;
        [bgs[i],bgs[i+1]]=[bgs[i+1],bgs[i]];
        persistConfig();populateBgThumbs();initBackground();
    }));
    // Remove button
    c.querySelectorAll('[data-rm-bg]').forEach(b=>b.addEventListener('click',()=>{
        bgs.splice(parseInt(b.dataset.rmBg),1);
        // Update active background
        if(bgs.length)CFG.backgroundImage=bgs[0];else CFG.backgroundImage='assets/background.png';
        document.getElementById('bg-image').src=CFG.backgroundImage;
        persistConfig();populateBgThumbs();initSlideshow();
    }));
}

function populatePageSettings(){const c=document.getElementById('page-settings');c.innerHTML='';
    CFG.pages.forEach((p,i)=>{const r=document.createElement('div');r.className='page-setting-row';
        r.innerHTML=`<button class="btn-icon-sm emoji-pick-btn" data-emoji-for="${i}" title="이모지 선택">😀</button><input type="text" value="${esc(p.name)}" data-page-name="${i}" class="setting-input" placeholder="페이지 이름">${i>0?`<button class="btn-icon-sm" data-rm-page="${i}">×</button>`:''}`;c.appendChild(r)});
    c.querySelectorAll('[data-rm-page]').forEach(b=>b.addEventListener('click',()=>{const idx=parseInt(b.dataset.rmPage);CFG.pages.splice(idx,1);if(CFG.activePage>=CFG.pages.length)CFG.activePage=0;populatePageSettings()}));
    c.querySelectorAll('.emoji-pick-btn').forEach(b=>b.addEventListener('click',e=>{
        e.stopPropagation();const idx=parseInt(b.dataset.emojiFor);
        let pop=document.getElementById('emoji-popup');if(pop){pop.remove()}
        pop=document.createElement('div');pop.id='emoji-popup';pop.className='emoji-popup';
        const emojis=['🏠','💼','🤖','📊','🎮','🎨','📚','🔧','🌐','💡','📝','🎯','🔬','📁','⭐','🛒','🎵','📸','✈️','❤️'];
        emojis.forEach(em=>{const btn=document.createElement('span');btn.className='emoji-opt';btn.textContent=em;btn.addEventListener('click',()=>{
            const inp=c.querySelector(`[data-page-name="${idx}"]`);if(inp){const cur=inp.value.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,'').trim();inp.value=em+' '+cur}pop.remove()});pop.appendChild(btn)});
        const none=document.createElement('span');none.className='emoji-opt';none.textContent='✕';none.title='이모지 제거';none.addEventListener('click',()=>{
            const inp=c.querySelector(`[data-page-name="${idx}"]`);if(inp)inp.value=inp.value.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,'').trim();pop.remove()});pop.appendChild(none);
        b.after(pop);document.addEventListener('click',function handler(){pop.remove();document.removeEventListener('click',handler)},{once:true})}))}
function saveAllSettings(){
    const labels=document.querySelectorAll('[data-clock-label]'),tzs=document.querySelectorAll('[data-clock-tz]');
    CFG.clocks=[];labels.forEach((el,i)=>{const l=el.value.trim(),t=tzs[i]?.value.trim();if(l&&t)CFG.clocks.push({label:l,timezone:t})});
    const eNames=document.querySelectorAll('[data-eng-name]'),eUrls=document.querySelectorAll('[data-eng-url]'),eIcons=document.querySelectorAll('[data-eng-icon]');
    CFG.searchEngines=[];eNames.forEach((el,i)=>{const n=el.value.trim(),u=eUrls[i]?.value.trim(),ic=eIcons[i]?.value.trim();if(n&&u)CFG.searchEngines.push({name:n,url:u,icon:ic||''})});engineIdx=0;
    const ddLabels=document.querySelectorAll('[data-dd-label]'),ddDates=document.querySelectorAll('[data-dd-date]');
    DDAYS=[];ddLabels.forEach((el,i)=>{const l=el.value.trim(),d=ddDates[i]?.value;if(l&&d)DDAYS.push({id:Date.now()+i,label:l,date:d})});
    document.querySelectorAll('[data-cs-cat]').forEach(el=>{CFG.cardSizes[el.dataset.csCat]=parseInt(el.value)||1});
    // cardColors already updated in real-time by color picker clicks
    document.querySelectorAll('[data-page-name]').forEach((el,i)=>{if(CFG.pages[i])CFG.pages[i].name=el.value.trim()||`페이지 ${i+1}`});
    CFG.backgroundOverlayOpacity=parseInt(document.getElementById('bg-opacity').value);
    CFG.timeBasedOverlay=document.getElementById('chk-time-overlay').checked;
    CFG.usageTracking=document.getElementById('chk-usage-tracking').checked;
    CFG.showRecommendations=document.getElementById('chk-show-recommendations').checked;
    // Background interval (unified system)
    const bgIntEl=document.getElementById('bg-interval-select');
    if(bgIntEl)CFG.bgIntervalMinutes=parseInt(bgIntEl.value)||10;
    CFG.customCSS=document.getElementById('custom-css').value;
    // 2026-08-21 수정(QA 경계값 테스트로 발견): 입력창은 min=1/max=168이지만 그건
    // HTML 표시상의 제약일 뿐 값 자체를 강제로 막지는 않는다 — 168보다 큰 값을 입력하면
    // 화면 안내(≈ N일)는 그 큰 값 그대로 보여주는데, 서버는 실제로 168시간까지만 인정하고
    // 그 이상은 조용히 잘라서 써서(server.js startAutoBackup) 사용자가 본 안내와 실제
    // 동작이 어긋나는 결함이 있었다. 저장 시점에 여기서도 서버와 동일한 범위로 미리
    // 맞춰서, 화면에 보이는 값과 실제로 적용되는 값이 항상 같게 한다.
    CFG.backupIntervalHours=Math.min(168,Math.max(1,parseInt(document.getElementById('backup-interval').value)||24));
    CFG.weatherApiKey=document.getElementById('weather-key-input').value.trim();
    CFG.weatherCity=document.getElementById('weather-city-input').value.trim()||'Seoul';
    CFG.weatherUnits=document.getElementById('weather-units-input').value;
    CFG.themeMode=document.getElementById('theme-mode-select').value;
    CFG.calendarStartMonday=document.getElementById('chk-cal-monday').checked;
    const blurEl=document.getElementById('blur-intensity');if(blurEl){CFG.blurIntensity=parseInt(blurEl.value)||18;applyBlur()}
    const glassEl=document.getElementById('glass-preset');if(glassEl){CFG.glassPreset=glassEl.value;applyGlassPreset()}
    const coEl=document.getElementById('card-opacity');if(coEl)CFG.cardOpacity=parseInt(coEl.value);
    const ckEl=document.getElementById('clock-opacity');if(ckEl)CFG.clockOpacity=parseInt(ckEl.value);
    applyOpacitySettings();
    const sortEl=document.getElementById('chk-auto-sort');if(sortEl)CFG.autoSortByUsage=sortEl.checked;
    const listEl=document.getElementById('chk-list-view');if(listEl)CFG.listView=listEl.checked;
    const motionEl=document.getElementById('chk-reduce-motion');if(motionEl){CFG.reduceMotion=motionEl.checked;applyReduceMotion()}
    // v7.0 settings
    const autoPomoEl=document.getElementById('chk-auto-pomo');if(autoPomoEl)CFG.pomoAutoSession=autoPomoEl.checked;
    const notifEl=document.getElementById('chk-event-notif');if(notifEl)CFG.eventNotifications=notifEl.checked;
    const layoutEl=document.getElementById('layout-preset');if(layoutEl){CFG.layoutPreset=layoutEl.value;applyLayoutPreset()}
    // F3: Search keywords
    const kwEl=document.getElementById('search-keywords');if(kwEl){try{const parsed={};kwEl.value.split('\n').forEach(line=>{const[k,v]=line.split('=').map(s=>s.trim());if(k&&v)parsed[k]=v});CFG.searchKeywords=parsed}catch{}}
    // E2: Habits
    const habEl=document.getElementById('habits-input');if(habEl){CFG.habits=habEl.value.split('\n').map(s=>s.trim()).filter(Boolean)}
    persistConfig();persistDDays();cacheForOffline();
    if(CFG.themeMode==='auto')initAutoTheme();
    renderClocks();updateTimeOverlay();renderDDays();initSlideshow();applyCustomCSS();initWeather();initSearch();
    renderPageTabs();renderDashboard();closeModal('modal-settings');
}

// ====================================================================
//  PROFILES
// ====================================================================
function initProfiles(){loadProfileList();
    document.getElementById('profile-select').addEventListener('change',async e=>{const name=e.target.value;
        if(!confirm(`"${name}" 프로필로 전환할까요?`)){loadProfileList();return}
        try{const r=await fetch('/api/profiles/load',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});if((await r.json()).success)location.reload()}catch{alert('전환 실패')}})}
async function loadProfileList(){try{const r=await fetch('/api/profiles');const d=await r.json();const sel=document.getElementById('profile-select');sel.innerHTML='';(d.profiles||['default']).forEach(p=>{sel.appendChild(new Option(p,p))});sel.value=d.active||'default'}catch{}}
async function populateProfileList(){try{const r=await fetch('/api/profiles');const d=await r.json();const c=document.getElementById('profile-list');c.innerHTML='';(d.profiles||[]).forEach(p=>{const row=document.createElement('div');row.className='profile-row';row.innerHTML=`<span>${esc(p)}</span>${p!=='default'?`<button class="btn-icon-sm" data-rm-profile="${esc(p)}">×</button>`:''}`;c.appendChild(row)});
    c.querySelectorAll('[data-rm-profile]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm(`"${b.dataset.rmProfile}" 프로필을 삭제할까요?`))return;await fetch('/api/profiles/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:b.dataset.rmProfile})});populateProfileList();loadProfileList()}))}catch{}}
async function saveProfile(){const name=document.getElementById('profile-name-input').value.trim();if(!name)return alert('프로필 이름을 입력하세요.');
    try{const r=await fetch('/api/profiles/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});const d=await r.json();if(d.success){alert(`"${name}" 프로필 저장 완료!`);document.getElementById('profile-name-input').value='';populateProfileList();loadProfileList()}else alert(d.error)}catch{alert('저장 실패')}}

// 2026-08-20 UX 개선: "168시간"처럼 시간 단위만 있으면 비개발자에게 며칠인지 바로
// 와닿지 않는다는 지적(설정 화면 사용성 감사) — 입력칸 옆에 "≈ N일" 환산을 실시간으로
// 보여준다.
function updateBackupIntervalHint(){
    const raw=parseInt(document.getElementById('backup-interval')?.value)||24;
    // 2026-08-21 수정(QA로 발견): 168시간을 넘는 값을 입력하면 서버가 저장 시점에 조용히
    // 168시간으로 잘라 쓰는데, 안내 문구는 입력한 그대로("≈ 4166일" 등)를 보여줘 실제
    // 적용값과 어긋나는 결함이 있었다 — 표시도 저장 로직과 동일하게 clamp한다.
    const h=Math.min(168,Math.max(1,raw));
    const el=document.getElementById('backup-interval-days');if(!el)return;
    if(h<24){el.textContent='';return}
    const days=h/24;
    const dayText=`≈ ${Number.isInteger(days)?days:days.toFixed(1)}일`;
    el.textContent=raw>168?`${dayText} (168시간까지만 적용됨)`:dayText;
}
// ====================================================================
//  EXPORT / IMPORT
// ====================================================================
function doExport(){
    const fmt=document.getElementById('export-format')?.value||'json';
    // Markdown/HTML은 가져오기(doImport)가 절대 다시 읽을 수 없는 보기·공유 전용
    // 형식이다(JSON만 _export_version/_backup_version 필드를 담아 복원 가능) — 사용자가
    // "백업"이라고 착각하고 이 형식만 내보냈다가 나중에 되돌릴 방법이 없어 당황하는 것을
    // 막기 위해, 실행 직전에 한 번 더 명확히 확인한다(2026-08-20 UX 개선).
    if(fmt!=='json'&&!confirm('Markdown/HTML은 보기·공유 전용입니다 — 나중에 다시 불러올(복원할) 수 없습니다.\n\n계속 내보낼까요? (복원 가능한 백업이 필요하면 JSON을 선택하세요)'))return;
    if(fmt==='json'){
        // JSON: fetch as blob to measure size and show toast
        fetch('/api/export').then(r=>{
            if(!r.ok)throw new Error('Export failed');
            return r.blob();
        }).then(blob=>{
            const a=document.createElement('a');a.href=URL.createObjectURL(blob);
            a.download=`dashboard-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();
            const sizeKB=(blob.size/1024).toFixed(1);
            showUndo(`JSON 내보내기 완료 (${sizeKB}KB)`,null);
        }).catch(()=>showUndo('내보내기 실패 — 서버 연결을 확인하세요',null));
        return;
    }
    // D4: Markdown export
    if(fmt==='markdown'){
        let md=`# 대시보드 백업\n_${new Date().toLocaleString('ko-KR')}_\n\n`;
        Object.entries(BM).forEach(([cat,items])=>{md+=`## ${cat}\n`;items.forEach(i=>md+=`- [${i.name}](${i.url})\n`);md+='\n'});
        md+=`## 📋 할 일\n`;TODOS.forEach(t=>md+=`- [${t.done?'x':' '}] ${t.text}${t.dueDate?' ('+t.dueDate+')':''}\n`);
        md+=`\n## 📅 D-Day\n`;DDAYS.forEach(d=>md+=`- ${d.label}: ${d.date}\n`);
        md+=`\n## 📝 메모\n`;(CFG.memoCards||[]).forEach(mc=>{md+=`### ${mc.title}\n`;(NOTES[mc.id]||[]).filter(n=>n).forEach(n=>md+=`- ${n}\n`)});
        const blob=new Blob([md],{type:'text/markdown'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dashboard-export.md';a.click();
        showUndo(`Markdown 내보내기 완료 (${(blob.size/1024).toFixed(1)}KB)`,null);
    }
    if(fmt==='html'){
        let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>대시보드 백업</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px}h1{color:#333}h2{color:#555;border-bottom:1px solid #ddd;padding-bottom:4px}a{color:#6ea8fe}ul{list-style:none;padding:0}li{padding:4px 0}.done{text-decoration:line-through;color:#999}</style></head><body>`;
        html+=`<h1>📊 대시보드 백업</h1><p>${new Date().toLocaleString('ko-KR')}</p>`;
        Object.entries(BM).forEach(([cat,items])=>{html+=`<h2>${esc(cat)}</h2><ul>`;items.forEach(i=>html+=`<li><a href="${esc(i.url)}">${esc(i.name)}</a></li>`);html+=`</ul>`});
        html+=`<h2>📋 할 일</h2><ul>`;TODOS.forEach(t=>html+=`<li class="${t.done?'done':''}">${t.done?'✅':'☐'} ${esc(t.text)}</li>`);html+=`</ul>`;
        html+=`</body></html>`;
        const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dashboard-export.html';a.click();
        showUndo(`HTML 내보내기 완료 (${(blob.size/1024).toFixed(1)}KB)`,null);
    }
}
async function doImport(){
    const input=document.getElementById('import-file');const f=input.files[0];if(!f)return;
    const text=await f.text();
    try{
        const d=JSON.parse(text);
        if(!d._export_version&&!d._backup_version)throw new Error('유효한 백업 파일이 아닙니다');
        // Build preview summary
        const stats=[];
        if(d.bookmarks){const count=Object.values(d.bookmarks).reduce((s,arr)=>s+(Array.isArray(arr)?arr.length:0),0);const cats=Object.keys(d.bookmarks).length;stats.push(`북마크: ${count}개 (${cats}개 카테고리)`)}
        if(d.todos?.items)stats.push(`할 일: ${d.todos.items.length}개`);
        if(d.notes){const noteCount=typeof d.notes==='object'?Object.keys(d.notes.notes||d.notes).length:0;stats.push(`메모: ${noteCount}개`)}
        if(d.events?.items)stats.push(`일정: ${d.events.items.length}개`);
        if(d.ddays?.items)stats.push(`D-Day: ${d.ddays.items.length}개`);
        if(d.config)stats.push('설정 포함');
        if(d._files){const fileCount=Object.keys(d._files).length;stats.push(`이미지/아이콘: ${fileCount}개`)}
        if(d._profiles){const profCount=Object.keys(d._profiles).length;stats.push(`프로필: ${profCount}개`)}
        const version=d._export_version||d._backup_version||'알 수 없음';
        const date=d._export_date||d._backup_date||'';
        const dateStr=date?new Date(date).toLocaleString('ko-KR'):'날짜 없음';
        const sizeKB=(f.size/1024).toFixed(1);
        const preview=`가져오기 미리보기\n\n`
            +`파일: ${f.name} (${sizeKB}KB)\n`
            +`버전: ${version}\n`
            +`날짜: ${dateStr}\n\n`
            +`포함된 데이터:\n${stats.map(s=>'  • '+s).join('\n')}\n\n`
            +`현재 데이터가 위 내용으로 교체됩니다.\n(현재 데이터의 안전 백업이 먼저 생성됩니다)\n\n계속하시겠습니까?`;
        if(!confirm(preview))return;
        const r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:text});
        const rd=await r.json();
        if(rd.success){
            const dropMsg=rd.bookmarksDroppedCount>0?` (URL 형식이 잘못된 북마크 ${rd.bookmarksDroppedCount}개는 건너뜀)`:'';
            showUndo(`가져오기 완료!${dropMsg} 새로고침합니다...`,null);setTimeout(()=>location.reload(),1000)
        }
        else{alert('가져오기 실패')}
    }catch(e){alert('유효하지 않은 파일: '+e.message)}
    input.value='';
}

// ====================================================================
//  DUPLICATE BOOKMARK DETECTION
// ====================================================================
function findDuplicateBookmarks(){
    const urlMap={};
    for(const[cat,items]of Object.entries(BM)){
        (items||[]).forEach((item,idx)=>{
            try{const u=new URL(item.url).origin+new URL(item.url).pathname.replace(/\/$/,'')}catch{return}
            const norm=item.url.replace(/\/$/,'').replace(/^https?:\/\/(www\.)?/,'').toLowerCase();
            if(!urlMap[norm])urlMap[norm]=[];
            urlMap[norm].push({name:item.name,cat,idx});
        });
    }
    const dupes=Object.entries(urlMap).filter(([,v])=>v.length>1);
    const cont=document.getElementById('dupe-results');
    if(!dupes.length){cont.style.display='block';cont.innerHTML='<p style="color:var(--accent)">✅ 중복 북마크가 없습니다!</p>';return}
    cont.style.display='block';
    let html=`<p style="margin-bottom:6px;color:var(--text-warn)">⚠️ ${dupes.length}개 중복 발견</p>`;
    dupes.forEach(([url,locs])=>{
        html+=`<div style="margin-bottom:8px;padding:6px;background:var(--card-bg);border-radius:6px">`;
        html+=`<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:4px;word-break:break-all">${esc(url)}</div>`;
        locs.forEach((l,i)=>{
            html+=`<div style="display:flex;align-items:center;gap:6px;padding:2px 0">`;
            html+=`<span style="flex:1">${esc(l.cat)} → ${esc(l.name)}</span>`;
            if(i>0)html+=`<button class="btn-icon-sm dupe-rm" data-dupe-cat="${esc(l.cat)}" data-dupe-name="${esc(l.name)}" data-dupe-idx="${l.idx}" title="삭제">×</button>`;
            html+=`</div>`;
        });
        html+=`</div>`;
    });
    cont.innerHTML=html;
    cont.querySelectorAll('.dupe-rm').forEach(b=>b.addEventListener('click',()=>{
        const cat=b.dataset.dupeCat,name=b.dataset.dupeName,idx=parseInt(b.dataset.dupeIdx);
        // Verify the item at idx still matches the expected name (guard against stale index)
        if(BM[cat]&&BM[cat][idx]&&BM[cat][idx].name===name){
            const removed=BM[cat].splice(idx,1)[0];
            TRASH.push({...removed,category:cat,deletedAt:new Date().toISOString()});
            persistBM();persistTrash();findDuplicateBookmarks();renderDashboard();
        } else {
            // Index shifted — re-scan to find correct item
            findDuplicateBookmarks();
        }
    }));
}

// ====================================================================
//  KEYBOARD SHORTCUTS
// ====================================================================
function initShortcuts(){document.addEventListener('keydown',e=>{
    // Ctrl+Z: Global undo (only when toast visible and NOT in text input)
    const tag=e.target.tagName;const inInput=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable;
    if((e.ctrlKey||e.metaKey)&&e.key==='z'&&(undoData||undoStack.length)&&!inInput){e.preventDefault();document.getElementById('undo-btn').click();return}
    if(inInput)return;
    if(e.key==='Escape'){if(document.getElementById('spotlight-overlay').classList.contains('open')){closeSpotlight();return}document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id));document.getElementById('shortcut-toast').classList.remove('visible');return}
    const sc=(CFG.shortcuts||[]).find(s=>s.key.toLowerCase()===e.key.toLowerCase());if(sc&&SHORTCUT_ACTIONS[sc.action]){e.preventDefault();SHORTCUT_ACTIONS[sc.action]()}
    // Number keys 1-9: scroll to category
    if(e.key>='1'&&e.key<='9'){e.preventDefault();focusCategory(parseInt(e.key))}})}
function showShortcutToast(){const toast=document.getElementById('shortcut-toast');let h='<div class="toast-grid">';(CFG.shortcuts||[]).forEach(s=>{h+=`<span class="toast-key">${esc(s.key)}</span><span class="toast-action">${esc(s.label||s.action)}</span>`});h+='<span class="toast-key">Esc</span><span class="toast-action">닫기</span></div>';toast.innerHTML=h;toast.classList.add('visible');clearTimeout(toast._ht);toast._ht=setTimeout(()=>toast.classList.remove('visible'),5000)}
function populateShortcutSettings(){const c=document.getElementById('shortcuts-list');c.innerHTML='';(CFG.shortcuts||[]).forEach((s,i)=>{const r=document.createElement('div');r.className='shortcut-row';r.innerHTML=`<input type="text" class="key-input setting-input" value="${esc(s.key)}" placeholder="키" data-sc-key="${i}" maxlength="10"><input type="text" class="setting-input" value="${esc(s.action)}" placeholder="액션" data-sc-action="${i}"><input type="text" class="setting-input" value="${esc(s.label||'')}" placeholder="표시 이름" data-sc-label="${i}"><button class="btn-icon-sm" data-rm-sc="${i}">×</button>`;c.appendChild(r)});
    c.querySelectorAll('[data-rm-sc]').forEach(b=>b.addEventListener('click',()=>{CFG.shortcuts.splice(parseInt(b.dataset.rmSc),1);populateShortcutSettings()}))}
function saveShortcuts(){const keys=document.querySelectorAll('[data-sc-key]'),acts=document.querySelectorAll('[data-sc-action]'),lbls=document.querySelectorAll('[data-sc-label]');CFG.shortcuts=[];keys.forEach((el,i)=>{const k=el.value.trim(),a=acts[i]?.value.trim(),l=lbls[i]?.value.trim();if(k&&a)CFG.shortcuts.push({key:k,action:a,label:l||a})});persistConfig();closeModal('modal-shortcuts')}

// Scroll to n-th category card
function focusCategory(n){
    const cards=document.querySelectorAll('.folder[data-category]');
    if(n>=1&&n<=cards.length){const card=cards[n-1];card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.outline='2px solid var(--accent)';card.style.outlineOffset='4px';
        setTimeout(()=>{card.style.outline='';card.style.outlineOffset=''},1200)}
}

// ====================================================================
//  SERVER HEALTH
// ====================================================================
let _healthInterval=15000;let _reconnectTimer=null;
function initServerHealth(){checkHealth();healthTimer=safeSetInterval(checkHealth,_healthInterval);
    // Accelerate health check when browser regains focus (e.g., after sleep)
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkHealth()});
    window.addEventListener('online',()=>checkHealth());
}
async function checkHealth(){
    const el=document.getElementById('server-status');
    const banner=document.getElementById('offline-banner');
    try{
        const ctrl=new AbortController();const tid=setTimeout(()=>ctrl.abort(),3000);
        const r=await fetch('/api/health',{signal:ctrl.signal});clearTimeout(tid);
        if(r.ok){
            const wasOffline=el.classList.contains('offline');
            el.classList.remove('offline');el.title='서버 연결됨';
            if(banner)banner.classList.remove('visible');
            if(wasOffline){
                // Recovered from offline
                flushOfflineQueue();cacheForOffline();
                showUndo('서버 연결 복구됨',null);
                // Reset to normal interval
                stopReconnect();
            }
        } else {el.classList.add('offline');el.title='서버 응답 오류';if(banner)banner.classList.add('visible');startReconnect()}
    }catch{el.classList.add('offline');el.title='서버 연결 끊김';if(banner)banner.classList.add('visible');startReconnect()}
}
function startReconnect(){
    if(_reconnectTimer)return; // Already reconnecting
    // Fast reconnect: try every 5 seconds while offline
    _reconnectTimer=setInterval(()=>{checkHealth()},5000);
}
function stopReconnect(){
    if(_reconnectTimer){clearInterval(_reconnectTimer);_reconnectTimer=null}
}

// ====================================================================
//  PWA
// ====================================================================
function registerSW(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.register('/sw.js').then(reg=>{
        // Check for updates every 30 minutes
        safeSetInterval(()=>{reg.update().catch(()=>{})},30*60*1000);
        // Also check when tab becomes visible
        document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{})});
    }).catch(()=>{});
    // Listen for SW update messages
    navigator.serviceWorker.addEventListener('message',e=>{
        if(e.data?.type==='SW_UPDATED'){
            showUndo('새 버전이 적용되었습니다. 새로고침하면 반영됩니다.',null);
        }
    });
}

// ====================================================================
//  TAB SYNC: Reload data when another tab saves changes
// ====================================================================
function initTabSync(){
    if(!_tabSync)return;
    _tabSync.onmessage=async(e)=>{
        if(e.data?.type!=='data-changed')return;
        // Pause outgoing sync to prevent echo loops
        _tabSyncPaused=true;
        try{
            const[bm,nt,cf,td,dd,ev]=await Promise.all([
                fetchJ('/api/bookmarks',BM),fetchJ('/api/notes',{notes:NOTES}),
                fetchJ('/api/config',CFG),fetchJ('/api/todos',{items:TODOS}),
                fetchJ('/api/ddays',{items:DDAYS}),fetchJ('/api/events',{items:EVENTS})
            ]);
            BM=bm;NOTES=nt.notes||NOTES;CFG=cf;TODOS=td.items||TODOS;DDAYS=dd.items||DDAYS;EVENTS=ev.items||EVENTS;
            applyTheme(CFG.theme||'dark');applyAccent(CFG.accentColor||'blue');
            applyBlur();applyGlassPreset();applyCustomCSS();applyLayoutPreset();
            renderDDays();renderPageTabs();renderDashboard();
        }catch{}
        setTimeout(()=>{_tabSyncPaused=false},500);
    };
}

// ====================================================================
//  MODALS
// ====================================================================
function initModals(){document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id)}))}
function openModal(id){const el=document.getElementById(id);if(id==='modal-shortcuts')populateShortcutSettings();if(id==='modal-todo-full')renderTodoFull();el.style.display='flex';requestAnimationFrame(()=>el.classList.add('open'))}
function closeModal(id){const el=document.getElementById(id);el.classList.remove('open');el.classList.add('closing');setTimeout(()=>{el.classList.remove('closing');el.style.display='none'},220)}

// ====================================================================
//  CONTEXT MENU (Right-click bookmarks)
// ====================================================================
let ctxTarget=null;
function initContextMenu(){
    const menu=document.getElementById('ctx-menu');
    document.addEventListener('contextmenu',e=>{
        const bm=e.target.closest('.bookmark-item');
        if(!bm){menu.classList.remove('open');return}
        e.preventDefault();
        ctxTarget={cat:bm.dataset.category,idx:parseInt(bm.dataset.index)};
        // Update pin label based on current state
        const pinItem=document.getElementById('ctx-pin');
        if(pinItem){const isPinned=BM[ctxTarget.cat]?.[ctxTarget.idx]?.pinned;pinItem.textContent=isPinned?'📌 고정 해제':'📌 상단 고정'}
        menu.style.left=Math.min(e.clientX,window.innerWidth-160)+'px';
        menu.style.top=Math.min(e.clientY,window.innerHeight-140)+'px';
        menu.classList.add('open');
    });
    document.addEventListener('click',()=>menu.classList.remove('open'));
    menu.querySelectorAll('[data-ctx]').forEach(item=>item.addEventListener('click',()=>{
        if(!ctxTarget)return;const{cat,idx}=ctxTarget;
        const action=item.dataset.ctx;
        if(action==='pin'){
            const bItem=BM[cat]?.[idx];if(!bItem)return;
            bItem.pinned=!bItem.pinned;if(!bItem.pinned)delete bItem.pinned;
            persistBM();renderDashboard();
        }
        else if(action==='edit')openBMModal('edit',cat,idx);
        else if(action==='open-new')window.open(BM[cat]?.[idx]?.url,'_blank');
        else if(action==='open-all-cat'){
            // A2: Open all bookmarks in category
            (BM[cat]||[]).forEach(b=>window.open(b.url,'_blank'));
        }
        else if(action==='move-to-page'){
            const bItem=BM[cat]?.[idx];if(!bItem)return;
            menu.classList.remove('open');
            showMoveBookmarkPopup(bItem,cat,idx);
            ctxTarget=null;return; // don't clear menu below, already handled
        }
        else if(action==='delete'){
            const bItem=BM[cat][idx];if(!bItem)return;
            TRASH.push({...bItem,category:cat,deletedAt:new Date().toISOString()});persistTrash();
            const backup={item:JSON.parse(JSON.stringify(bItem)),cat,idx};
            BM[cat].splice(idx,1);persistBM();renderDashboard();
            showUndo(`"${bItem.name}" 삭제됨`,()=>{BM[backup.cat].splice(backup.idx,0,backup.item);TRASH.pop();persistBM();persistTrash();renderDashboard()});
        }
        menu.classList.remove('open');ctxTarget=null;
    }));
}

// Move bookmark to any category on any page
function showMoveBookmarkPopup(bItem,srcCat,srcIdx){
    const existing=document.querySelector('.move-page-popup');if(existing)existing.remove();
    const popup=document.createElement('div');popup.className='move-page-popup move-bm-popup';
    popup.innerHTML=`<div class="mpp-title">"${esc(bItem.name)}" 이동</div>`;
    // Find which page the source category belongs to
    let srcPageIdx=CFG.activePage;
    CFG.pages.forEach((pg,pi)=>{if([...(pg.topCategories||[]),...(pg.bottomCategories||[])].includes(srcCat))srcPageIdx=pi});
    CFG.pages.forEach((pg,pi)=>{
        const isCurrentPage=(pi===srcPageIdx);
        const header=document.createElement('div');header.className='mpp-page-header';
        header.textContent=pg.name+(isCurrentPage?' (현재)':'');
        if(isCurrentPage)header.style.color='var(--accent)';
        popup.appendChild(header);
        const cats=[...(pg.topCategories||[]),...(pg.bottomCategories||[])];
        if(!cats.length){
            const empty=document.createElement('div');empty.className='mpp-btn';empty.style.cssText='color:var(--text-muted);cursor:default;font-style:italic';
            empty.textContent='카테고리 없음';popup.appendChild(empty);return;
        }
        cats.forEach(c=>{
            const isCurrent=(c===srcCat);
            const btn=document.createElement('button');btn.className='mpp-btn';
            btn.textContent=c+(isCurrent?' ← 현재 위치':'');
            if(isCurrent){btn.style.cssText='color:var(--text-muted);cursor:default;opacity:.5';btn.disabled=true}
            else{
                btn.addEventListener('click',()=>{
                    const backup={item:JSON.parse(JSON.stringify(bItem)),cat:srcCat,idx:srcIdx};
                    BM[srcCat].splice(srcIdx,1);
                    if(!BM[c])BM[c]=[];
                    BM[c].push(bItem);
                    persistBM();renderDashboard();popup.remove();
                    const targetPageName=pg.name;
                    const movedMsg=pi!==srcPageIdx?`"${bItem.name}" → "${c}" (${targetPageName}) 이동됨`:`"${bItem.name}" → "${c}" 이동됨`;
                    showUndo(movedMsg,()=>{
                        BM[c]=BM[c].filter(b=>b!==bItem);
                        BM[backup.cat].splice(backup.idx,0,backup.item);
                        persistBM();renderDashboard();
                    });
                });
            }
            popup.appendChild(btn);
        });
    });
    document.body.appendChild(popup);
    popup.style.position='fixed';popup.style.left='50%';popup.style.top='50%';popup.style.transform='translate(-50%,-50%)';
    setTimeout(()=>document.addEventListener('click',e=>{if(!popup.contains(e.target))popup.remove()},{once:true}),10);
}

// ====================================================================
//  SETTINGS SEARCH
// ====================================================================
function initSettingsSearch(){
    document.getElementById('settings-search')?.addEventListener('input',e=>{
        const q=e.target.value.toLowerCase().trim();
        document.querySelectorAll('.setting-group').forEach(g=>{
            if(!q){g.classList.remove('hidden');return}
            const text=(g.querySelector('.setting-label')?.textContent||'')+(g.textContent||'');
            g.classList.toggle('hidden',!text.toLowerCase().includes(q));
        });
    });
}

// ====================================================================
//  STATS (Top 10 + Category)
// ====================================================================
function populateStats(){
    // Top 10
    const top10=document.getElementById('stats-top10');top10.innerHTML='';
    const entries=Object.entries(USAGE).sort((a,b)=>b[1].count-a[1].count).slice(0,10);
    const maxCount=entries[0]?.[1]?.count||1;
    if(!entries.length){top10.innerHTML='<p style="font-size:.78rem;color:var(--text-muted)">아직 클릭 기록이 없습니다</p>'}
    else{
        // Build URL→{name,cat} lookup for display
        const urlMap={};Object.entries(BM).forEach(([cat,items])=>{if(Array.isArray(items))items.forEach(b=>{urlMap[b.url]={name:b.name,cat}})});
        entries.forEach(([key,v])=>{
        // Handle both old "cat::name" and new URL-based keys
        let name,cat;
        if(key.startsWith('http://')||key.startsWith('https://')){
            const info=urlMap[key];name=info?.name||new URL(key).hostname;cat=info?.cat||'기타';
        }else{const parts=key.split('::');cat=parts[0];name=parts[1]||key}
        const bar=document.createElement('div');bar.className='stat-bar';
        bar.innerHTML=`<span class="stat-name" title="${esc(cat+' › '+name)}">${esc(name)}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${Math.round(v.count/maxCount*100)}%"></div></div><span class="stat-count">${v.count}</span>`;
        top10.appendChild(bar);
    })}
    // Category
    const catStats=document.getElementById('stats-categories');catStats.innerHTML='';
    const urlMap2={};Object.entries(BM).forEach(([cat,items])=>{if(Array.isArray(items))items.forEach(b=>{urlMap2[b.url]=cat})});
    const catCounts={};Object.entries(USAGE).forEach(([key,v])=>{
        let cat;
        if(key.startsWith('http://')||key.startsWith('https://')){cat=urlMap2[key]||'기타'}
        else{cat=key.split('::')[0]}
        catCounts[cat]=(catCounts[cat]||0)+v.count
    });
    const catEntries=Object.entries(catCounts).sort((a,b)=>b[1]-a[1]);
    const catMax=catEntries[0]?.[1]||1;
    // D3: SVG Donut chart
    if(catEntries.length){
        const totalClicks=catEntries.reduce((s,[,c])=>s+c,0);
        const chartColors=['#6ea8fe','#f87171','#fbbf24','#4ade80','#a78bfa','#f472b6','#22d3ee','#fb923c'];
        let svg='<svg viewBox="0 0 42 42" class="donut-chart"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--input-bg)" stroke-width="5"/>';
        let offset=25;
        catEntries.slice(0,8).forEach(([cat,count],i)=>{
            const pct=count/totalClicks*100;
            svg+=`<circle cx="21" cy="21" r="15.9" fill="none" stroke="${chartColors[i%chartColors.length]}" stroke-width="5" stroke-dasharray="${pct} ${100-pct}" stroke-dashoffset="${offset}" class="donut-seg"><title>${esc(cat)}: ${count}</title></circle>`;
            offset-=pct;
        });
        svg+='</svg>';
        const legend=catEntries.slice(0,8).map(([cat,count],i)=>`<span class="legend-item"><span class="legend-dot" style="background:${chartColors[i%chartColors.length]}"></span>${esc(cat)} (${count})</span>`).join('');
        catStats.innerHTML=`<div class="chart-wrap">${svg}<div class="chart-legend">${legend}</div></div>`;
    }
    catEntries.forEach(([cat,count])=>{
        const bar=document.createElement('div');bar.className='stat-bar';
        bar.innerHTML=`<span class="stat-name">${esc(cat)}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${Math.round(count/catMax*100)}%"></div></div><span class="stat-count">${count}</span>`;
        catStats.appendChild(bar);
    });
    // D2: Todo completion streak
    const streakEl=document.getElementById('stats-streak');
    if(streakEl){streakEl.innerHTML='';streakEl.appendChild(createStreakContent())}
    // C5: Heatmap
    const heatmapEl=document.getElementById('stats-heatmap');
    if(heatmapEl){heatmapEl.innerHTML='';heatmapEl.appendChild(createHeatmapContent())}
    // C2: Pomo stats
    const pomoEl=document.getElementById('stats-pomo');
    if(pomoEl){pomoEl.innerHTML='';pomoEl.appendChild(createPomoStatsContent())}
}

// ====================================================================
//  TRASH
// ====================================================================
function populateTrash(){
    const c=document.getElementById('trash-list');if(!c)return;c.innerHTML='';
    if(!TRASH.length){c.innerHTML='<p style="font-size:.78rem;color:var(--text-muted)">비어있음</p>';return}
    TRASH.slice().reverse().forEach((item,ri)=>{
        const i=TRASH.length-1-ri;
        const row=document.createElement('div');row.className='trash-item';
        const d=new Date(item.deletedAt);const dateStr=d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});
        row.innerHTML=`<span class="trash-item-name">${esc(item.name)}</span><span class="trash-item-cat">${esc(item.category||'')}</span><span class="trash-item-date">${dateStr}</span>`;
        const btn=document.createElement('button');btn.className='trash-restore';btn.textContent='복원';
        btn.addEventListener('click',()=>{
            const restored=TRASH.splice(i,1)[0];
            if(!BM[restored.category])BM[restored.category]=[];
            BM[restored.category].push({name:restored.name,url:restored.url,icon:restored.icon||''});
            persistBM();persistTrash();renderDashboard();populateTrash();
        });
        row.appendChild(btn);c.appendChild(row);
    });
}


// ====================================================================
//  CARD COLOR SETTINGS
// ====================================================================
const PALETTE_COLORS=['','#f87171','#fb923c','#fbbf24','#4ade80','#22d3ee','#818cf8','#c084fc','#fb7185','#6ea8fe'];
function populateCardColorSettings(){
    const c=document.getElementById('card-color-settings');if(!c)return;c.innerHTML='';
    const page=curPage();[...(page.topCategories||[]),...(page.bottomCategories||[])].forEach(cat=>{
        if(!BM[cat])return;
        const row=document.createElement('div');row.className='card-size-row';row.style.marginBottom='10px';
        row.innerHTML=`<span style="min-width:80px">${esc(cat)}</span>`;
        const wrap=document.createElement('div');wrap.className='color-picker-wrap';
        PALETTE_COLORS.forEach(color=>{
            const dot=document.createElement('button');dot.className='color-dot'+(color===''?' none':'');
            if(color)dot.style.background=color;
            if((CFG.cardColors[cat]||'')===color)dot.classList.add('active');
            dot.addEventListener('click',()=>{
                if(color)CFG.cardColors[cat]=color;else delete CFG.cardColors[cat];
                wrap.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('active'));dot.classList.add('active');
            });
            wrap.appendChild(dot);
        });
        row.appendChild(wrap);c.appendChild(row);
    });
}

function populateAccentPicker(){
    const c=document.getElementById('accent-picker');if(!c)return;
    c.querySelectorAll('.accent-dot').forEach(dot=>{
        dot.classList.toggle('active',dot.dataset.accent===(CFG.accentColor||'blue'));
        dot.onclick=()=>{c.querySelectorAll('.accent-dot').forEach(d=>d.classList.remove('active'));dot.classList.add('active');applyAccent(dot.dataset.accent);persistConfig()};
    });
}

// Number key shortcuts (1-9) handled by focusCategory() in initShortcuts()


// ====================================================================
//  PERSIST (D1: save indicator)
// ====================================================================
// ====================================================================
//  UNIFIED PERSIST SYSTEM — debounce + retry + save indicator + offline
// ====================================================================
const _saveTimers={};
function debouncedSave(key,fn,delay=300){clearTimeout(_saveTimers[key]);_saveTimers[key]=setTimeout(fn,delay)}
function _persist(key,url,getData,delay=300){
    showSaveIndicator();
    // Generation counter: only the latest request matters
    if(!_persistGen[key])_persistGen[key]=0;
    const gen=++_persistGen[key];
    debouncedSave(key,async()=>{
        if(gen!==_persistGen[key])return; // A newer save was queued, skip this one
        const body=JSON.stringify(getData());
        for(let attempt=0;attempt<=2;attempt++){
            if(gen!==_persistGen[key])return; // Abort if superseded during retry
            try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body});
                if(r.ok){showSaveIndicator(true);cacheForOffline();
                    // Notify other tabs
                    if(_tabSync&&!_tabSyncPaused){try{_tabSync.postMessage({type:'data-changed',key})}catch{}}
                    return}}catch{}
            if(attempt<2)await new Promise(r=>setTimeout(r,500*(attempt+1)));
        }
        queueOffline(url,getData());showSaveIndicator('error');
    },delay);
}
function persistBM(){_persist('bm','/api/bookmarks',()=>BM)}
function persistConfig(){_persist('cfg','/api/config',()=>CFG,500)}
function persistNotes(){_persist('notes','/api/notes',()=>({notes:NOTES}),500)}
function persistTodos(){_persist('todos','/api/todos',()=>({items:TODOS}))}
function persistEvents(){_persist('events','/api/events',()=>({items:EVENTS}))}
function persistDDays(){_persist('dd','/api/ddays',()=>({items:DDAYS}))}
function persistTrash(){_persist('trash','/api/trash',()=>({items:TRASH}),500)}
function persistPomoStats(){_persist('pomo','/api/pomo-stats',()=>({sessions:POMO_STATS}),1000)}
// esc()/ESC_MAP moved to lib/esc.js (2026-08-31) — loaded via <script src="lib/esc.js">
// before this file in index.html, so both stay globally available here unchanged.
// Extracted so the same code path used by the live app can also be required directly
// from test/esc.test.js (script.js itself can't be require()'d — it references
// document/window at load time).

// D1: Save indicator
function showSaveIndicator(state){
    const el=document.getElementById('save-indicator');if(!el)return;
    if(state===true){el.textContent='✓ 저장됨';el.className='save-indicator saved';clearTimeout(saveIndicatorTimer);saveIndicatorTimer=setTimeout(()=>el.className='save-indicator',1500)}
    else if(state==='error'){el.textContent='⚠ 저장 실패';el.className='save-indicator error';clearTimeout(saveIndicatorTimer);saveIndicatorTimer=setTimeout(()=>el.className='save-indicator',3000)}
    else{el.textContent='저장 중…';el.className='save-indicator saving'}
}

// 2026-08-20 UX 개선: 북마크/카테고리를 드래그하는 동안 화면 가장자리에 커서를 대면
// 자동으로 스크롤되게 한다 — 카테고리가 많으면(실사용 59개 확인) 옮기려는 대상 카드가
// 화면 밖에 있을 때 지금까지는 물리적으로 드래그가 불가능했다(사용성 감사로 확인한
// 실제 차단 사례 — 자동 스크롤 관련 코드가 이 파일에 아예 없었음). 북마크 드래그
// (dragSrc)·카테고리 드래그(catDragSrc) 중일 때만 작동해 다른 드래그 기능(칸반, 파일
// 가져오기 등)에는 영향 없다.
function initDragAutoScroll(){
    const EDGE=80,MAX_SPEED=18;
    let scrollDir=0,rafId=null;
    function tick(){
        if(scrollDir!==0){window.scrollBy(0,scrollDir);rafId=requestAnimationFrame(tick)}
        else rafId=null;
    }
    document.addEventListener('dragover',e=>{
        if(!dragSrc&&!catDragSrc){scrollDir=0;return}
        const y=e.clientY,h=window.innerHeight;
        if(y<EDGE)scrollDir=-Math.max(2,Math.ceil((EDGE-y)/EDGE*MAX_SPEED));
        else if(y>h-EDGE)scrollDir=Math.max(2,Math.ceil((EDGE-(h-y))/EDGE*MAX_SPEED));
        else scrollDir=0;
        if(scrollDir!==0&&rafId===null)rafId=requestAnimationFrame(tick);
    });
    document.addEventListener('dragend',()=>{scrollDir=0});
    document.addEventListener('drop',()=>{scrollDir=0});
}
// ====================================================================
//  A3: DRAG URL DROP (drag URL from browser address bar)
// ====================================================================
function initDragURLDrop(){
    document.addEventListener('dragover',e=>{if(!e.dataTransfer.types.includes('text/uri-list')&&!e.dataTransfer.types.includes('text/plain'))return;
        const card=e.target.closest('.folder');if(card){e.preventDefault();card.classList.add('url-drop-target')}});
    document.addEventListener('dragleave',e=>{const card=e.target.closest('.folder');if(card)card.classList.remove('url-drop-target')});
    document.addEventListener('drop',e=>{
        document.querySelectorAll('.url-drop-target').forEach(c=>c.classList.remove('url-drop-target'));
        if(dragSrc)return; // internal drag
        const card=e.target.closest('.folder');if(!card)return;
        const cat=card.dataset.category;if(!cat)return;
        let url=e.dataTransfer.getData('text/uri-list')||e.dataTransfer.getData('text/plain')||'';
        url=url.trim().split('\n')[0];
        if(!url.startsWith('http'))return;
        e.preventDefault();
        try{const u=new URL(url);const name=u.hostname.replace('www.','');
            BM[cat].push({name,url});persistBM();renderDashboard();
            showUndo(`"${name}" 추가됨`,null);
        }catch{}
    });
}

// ====================================================================
//  A6: MULTI-SELECT & BULK ACTIONS
// ====================================================================
function initMultiSelect(){
    document.addEventListener('click',e=>{
        if(!e.ctrlKey&&!e.metaKey)return;
        const bm=e.target.closest('.bookmark-item');if(!bm)return;
        e.preventDefault();e.stopPropagation();
        const key=bm.dataset.category+'::'+bm.dataset.index;
        if(multiSelected.has(key)){multiSelected.delete(key);bm.classList.remove('multi-selected')}
        else{multiSelected.add(key);bm.classList.add('multi-selected')}
        updateMultiBar();
    });
}
function updateMultiBar(){
    let bar=document.getElementById('multi-bar');
    if(!multiSelected.size){if(bar)bar.remove();return}
    if(!bar){bar=document.createElement('div');bar.id='multi-bar';bar.className='multi-action-bar';document.body.appendChild(bar)}
    bar.innerHTML=`<span>${multiSelected.size}개 선택</span>
        <button class="btn btn-sm btn-secondary" id="multi-move">이동</button>
        <button class="btn btn-sm btn-danger" id="multi-del">삭제</button>
        <button class="btn btn-sm btn-ghost" id="multi-cancel">취소</button>`;
    bar.querySelector('#multi-del').addEventListener('click',()=>{
        const items=[...multiSelected].map(k=>{const[cat,idx]=k.split('::');return{cat,idx:parseInt(idx)}}).sort((a,b)=>b.idx-a.idx);
        items.forEach(({cat,idx})=>{const item=BM[cat]?.[idx];if(item){TRASH.push({...item,category:cat,deletedAt:new Date().toISOString()});BM[cat].splice(idx,1)}});
        persistBM();persistTrash();multiSelected.clear();updateMultiBar();renderDashboard();
    });
    bar.querySelector('#multi-move').addEventListener('click',()=>{
        // Show popup with all categories from all pages
        const existing=document.querySelector('.move-page-popup');if(existing)existing.remove();
        const popup=document.createElement('div');popup.className='move-page-popup move-bm-popup';
        popup.innerHTML=`<div class="mpp-title">${multiSelected.size}개 북마크 이동</div>`;
        CFG.pages.forEach(pg=>{
            const header=document.createElement('div');header.className='mpp-page-header';header.textContent=pg.name;
            popup.appendChild(header);
            [...(pg.topCategories||[]),...(pg.bottomCategories||[])].forEach(c=>{
                if(!BM[c]&&BM[c]!==undefined)return;
                const btn=document.createElement('button');btn.className='mpp-btn';btn.textContent=c;
                btn.addEventListener('click',()=>{
                    const items=[...multiSelected].map(k=>{const[cat,idx]=k.split('::');return{cat,idx:parseInt(idx)}}).sort((a,b)=>b.idx-a.idx);
                    items.forEach(({cat,idx})=>{if(cat===c)return;const item=BM[cat].splice(idx,1)[0];if(item)BM[c].push(item)});
                    persistBM();multiSelected.clear();updateMultiBar();renderDashboard();popup.remove();
                });
                popup.appendChild(btn);
            });
        });
        document.body.appendChild(popup);
        popup.style.position='fixed';popup.style.left='50%';popup.style.top='50%';popup.style.transform='translate(-50%,-50%)';
        setTimeout(()=>document.addEventListener('click',e=>{if(!popup.contains(e.target))popup.remove()},{once:true}),10);
    });
    bar.querySelector('#multi-cancel').addEventListener('click',()=>{multiSelected.clear();document.querySelectorAll('.multi-selected').forEach(e=>e.classList.remove('multi-selected'));updateMultiBar()});
}

// ====================================================================
//  A7: IMPORT DRAG & CLIPBOARD
// ====================================================================
function initImportDragDrop(){
    const body=document.body;
    body.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();body.classList.add('import-drag')}});
    body.addEventListener('dragleave',e=>{if(e.target===body)body.classList.remove('import-drag')});
    body.addEventListener('drop',async e=>{
        body.classList.remove('import-drag');
        const file=[...e.dataTransfer.files].find(f=>f.name.endsWith('.json'));
        if(!file)return;e.preventDefault();
        try{const text=await file.text();const d=JSON.parse(text);
            if(!d._export_version&&!d._backup_version)return;
            if(!confirm('드래그한 파일로 데이터를 교체할까요?'))return;
            const r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:text});
            if((await r.json()).success){alert('가져오기 완료!');location.reload()}}catch(e){alert('유효하지 않은 파일')}
    });
}

// ====================================================================
//  B4: ONBOARDING GUIDE
// ====================================================================
function initOnboarding(){
    if(CFG.onboardingDone)return;
    const totalBM=Object.values(BM).reduce((s,a)=>s+a.length,0);
    if(totalBM>0){CFG.onboardingDone=true;persistConfig();return}
    const ov=document.createElement('div');ov.className='onboarding-overlay';ov.id='onboarding';
    ov.innerHTML=`<div class="onboarding-card">
        <h3>🎉 대시보드에 오신 것을 환영합니다!</h3>
        <div class="onboarding-steps">
            <div class="ob-step"><span class="ob-num">1</span><span>편집 모드(E키)로 카테고리와 북마크를 추가하세요</span></div>
            <div class="ob-step"><span class="ob-num">2</span><span>설정(S키)에서 시계, 배경, 테마를 커스터마이즈하세요</span></div>
            <div class="ob-step"><span class="ob-num">3</span><span>F키로 통합 검색, > 입력으로 명령 실행</span></div>
            <div class="ob-step"><span class="ob-num">4</span><span>Ctrl+클릭으로 여러 북마크 선택, 드래그로 URL 등록</span></div>
        </div>
        <button class="btn btn-primary" id="ob-close">시작하기</button>
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add('visible'));
    document.getElementById('ob-close').addEventListener('click',()=>{ov.classList.remove('visible');setTimeout(()=>ov.remove(),300);CFG.onboardingDone=true;persistConfig()});
}

// ====================================================================
//  C2: POMODORO STATS DASHBOARD
// ====================================================================
function createPomoStatsContent(){
    const c=document.createElement('div');c.className='pomo-stats-content';
    // Last 7 days
    const today=new Date();const days=[];
    for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10))}
    const dayCounts=days.map(d=>POMO_STATS.filter(s=>s.date===d).reduce((sum,s)=>sum+s.minutes,0));
    const maxMin=Math.max(...dayCounts,1);
    let html='<div class="pomo-chart">';
    days.forEach((d,i)=>{const h=Math.max(4,Math.round(dayCounts[i]/maxMin*80));const label=new Date(d).toLocaleDateString('ko',{weekday:'short'});
        html+=`<div class="pomo-bar-wrap"><div class="pomo-bar" style="height:${h}px" title="${dayCounts[i]}분"></div><span class="pomo-bar-label">${label}</span></div>`});
    html+='</div>';
    const totalWeek=dayCounts.reduce((s,v)=>s+v,0);
    const totalAll=POMO_STATS.reduce((s,v)=>s+v.minutes,0);
    html+=`<div class="pomo-summary"><span>이번 주: <b>${totalWeek}분</b></span><span>전체: <b>${totalAll}분</b></span><span>세션: <b>${POMO_STATS.length}회</b></span></div>`;
    c.innerHTML=html;return c;
}
function recordPomoSession(minutes){
    POMO_STATS.push({date:new Date().toISOString().slice(0,10),minutes,timestamp:Date.now()});
    persistPomoStats();
}

// ====================================================================
//  C3: MEMO MARKDOWN PREVIEW
// ====================================================================
function renderMiniMarkdown(text){
    return text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,'<em>$1</em>')
        .replace(/`(.+?)`/g,'<code>$1</code>')
        .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" class="auto-link">$1</a>')
        .replace(/^- (.+)$/gm,'• $1');
}

// ====================================================================
//  C5: USAGE HEATMAP (GitHub-style)
// ====================================================================
function createHeatmapContent(){
    const c=document.createElement('div');c.className='heatmap-content';
    const today=new Date();const days=90;const data={};
    // Aggregate usage by date from USAGE timestamps (use hourly data if available)
    Object.values(USAGE).forEach(u=>{if(u.history){u.history.forEach(h=>{const d=h.slice(0,10);data[d]=(data[d]||0)+1})}});
    // If no history, use daily count estimate
    if(!Object.keys(data).length){Object.values(USAGE).forEach(u=>{if(u.lastUsed){const d=u.lastUsed.slice(0,10);data[d]=(data[d]||0)+u.count}})}
    const maxVal=Math.max(...Object.values(data),1);
    let html='<div class="heatmap-grid">';
    for(let i=days-1;i>=0;i--){
        const d=new Date(today);d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);
        const val=data[key]||0;const level=val===0?0:Math.min(4,Math.ceil(val/maxVal*4));
        html+=`<div class="hm-cell hm-${level}" title="${key}: ${val}클릭"></div>`;
    }
    html+='</div>';
    c.innerHTML=html;return c;
}

// ====================================================================
//  D2: OFFLINE MODE
// ====================================================================
function loadOfflineCache(){
    try{
        BM=JSON.parse(localStorage.getItem('_cache_bm')||'{}');
        CFG=JSON.parse(localStorage.getItem('_cache_cfg')||'{}');
        NOTES=JSON.parse(localStorage.getItem('_cache_notes')||'{}');
        TODOS=JSON.parse(localStorage.getItem('_cache_todos')||'[]');
        DDAYS=JSON.parse(localStorage.getItem('_cache_ddays')||'[]');
        EVENTS=JSON.parse(localStorage.getItem('_cache_events')||'[]');
        USAGE=JSON.parse(localStorage.getItem('_cache_usage')||'{}');
        TRASH=JSON.parse(localStorage.getItem('_cache_trash')||'[]');
    }catch{}
}
function cacheForOffline(){
    try{
        const data={bm:BM,cfg:CFG,notes:NOTES,todos:TODOS,ddays:DDAYS,events:EVENTS,usage:USAGE,trash:TRASH};
        const json=JSON.stringify(data);
        // Check approximate size before writing (5MB limit for most browsers)
        if(json.length>4*1024*1024){
            // Too large — cache only essential data
            localStorage.setItem('_cache_bm',JSON.stringify(BM));
            localStorage.setItem('_cache_cfg',JSON.stringify(CFG));
            localStorage.setItem('_cache_todos',JSON.stringify(TODOS));
            return;
        }
        localStorage.setItem('_cache_bm',JSON.stringify(BM));
        localStorage.setItem('_cache_cfg',JSON.stringify(CFG));
        localStorage.setItem('_cache_notes',JSON.stringify(NOTES));
        localStorage.setItem('_cache_todos',JSON.stringify(TODOS));
        localStorage.setItem('_cache_ddays',JSON.stringify(DDAYS));
        localStorage.setItem('_cache_events',JSON.stringify(EVENTS));
        localStorage.setItem('_cache_usage',JSON.stringify(USAGE));
        localStorage.setItem('_cache_trash',JSON.stringify(TRASH));
    }catch(e){
        // QuotaExceededError — clear old cache and retry with essentials only
        console.warn('[Cache] localStorage quota exceeded, caching essentials only');
        try{
            localStorage.removeItem('_cache_usage');
            localStorage.removeItem('_cache_trash');
            localStorage.setItem('_cache_bm',JSON.stringify(BM));
            localStorage.setItem('_cache_cfg',JSON.stringify(CFG));
            localStorage.setItem('_cache_todos',JSON.stringify(TODOS));
        }catch{}
    }
}
function queueOffline(url,data){
    offlineQueue.push({url,data});showSaveIndicator();
    const el=document.getElementById('save-indicator');if(el){el.textContent='⚠ 오프라인';el.className='save-indicator offline'}
}
async function flushOfflineQueue(){
    if(!offlineQueue.length)return;
    const q=[...offlineQueue];offlineQueue=[];
    for(const{url,data}of q){
        try{await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})}catch{offlineQueue.push({url,data})}
    }
    if(!offlineQueue.length){showSaveIndicator(true);console.log('[Offline] Queue flushed successfully')}
}
// Auto-flush when connection returns
window.addEventListener('online',()=>{console.log('[Network] Online — flushing queue');flushOfflineQueue()});
window.addEventListener('offline',()=>{const el=document.getElementById('save-indicator');if(el){el.textContent='⚡ 오프라인';el.className='save-indicator offline'}});

// ====================================================================
//  D3: VERSION MIGRATION
// ====================================================================
function migrateVersion(){
    try{
        const cached=JSON.parse(localStorage.getItem('_cache_cfg')||'{}');
        const ver=cached._version||0;
        if(ver<53){
            // Migrate todo structure
            const todos=JSON.parse(localStorage.getItem('_cache_todos')||'[]');
            if(Array.isArray(todos))todos.forEach(t=>{if(!t.subtasks)t.subtasks=[];if(!t.tags)t.tags=[];if(!t.recurring)t.recurring=''});
            localStorage.setItem('_cache_todos',JSON.stringify(todos));
        }
    }catch{}
}

// ====================================================================
//  D4: FULL KEYBOARD NAVIGATION
// ====================================================================
function initKeyboardNav(){
    document.addEventListener('keydown',e=>{
        const tag=e.target.tagName;const editable=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable;
        if(editable)return;
        // Tab focus through bookmarks
        if(e.key==='Tab'){
            const bookmarks=[...document.querySelectorAll('.bookmark-item')];
            if(!bookmarks.length)return;
            const cur=document.activeElement?.closest('.bookmark-item');
            const idx=cur?bookmarks.indexOf(cur):-1;
            const next=e.shiftKey?Math.max(0,idx-1):Math.min(bookmarks.length-1,idx+1);
            e.preventDefault();bookmarks[next]?.focus();
        }
        // Enter to open focused bookmark
        if(e.key==='Enter'){
            const bm=document.activeElement?.closest('.bookmark-item');
            if(bm){e.preventDefault();window.location.href=bm.href}
        }
    });
}

// ====================================================================
//  SETTINGS: New options for B2, B7, A5, C2, C5, A7
// ====================================================================

// ====================================================================
//  v6.0 FEATURES
// ====================================================================

// B1: EMOJI PICKER FOR CATEGORIES
// B4: POMODORO CIRCULAR PROGRESS (SVG)
function updatePomoDisplay(remaining,total,isBreak){
    const widget=document.querySelector('.pomodoro-widget');if(!widget)return;
    const pct=total>0?remaining/total:0;
    let svg=widget.querySelector('.pomo-svg');
    if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','pomo-svg');svg.setAttribute('viewBox','0 0 36 36');
        svg.innerHTML=`<circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--glass-border)" stroke-width="2.5"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="${isBreak?'var(--success)':'var(--accent)'}" stroke-width="2.5" stroke-dasharray="100 100" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 18 18)" class="pomo-ring"/>`;
        const timeEl=widget.querySelector('.pomo-time');if(timeEl)widget.insertBefore(svg,timeEl);
    }
    const ring=svg.querySelector('.pomo-ring');if(ring){
        const dashOffset=100-(pct*100);ring.setAttribute('stroke-dashoffset',dashOffset);
        ring.setAttribute('stroke',isBreak?'var(--success)':'var(--accent)');
    }
}

// B6: SCROLL POSITION RESTORE
function initScrollRestore(){
    const saved=parseInt(sessionStorage.getItem('_scrollY')||'0');
    if(saved>0)setTimeout(()=>window.scrollTo(0,saved),100);
    let st;window.addEventListener('scroll',()=>{clearTimeout(st);st=setTimeout(()=>sessionStorage.setItem('_scrollY',window.scrollY),200)});
}

// C3: BOOKMARK GROUPS (Open multiple tabs)
function openBookmarkGroupModal(){
    const groups=CFG.bookmarkGroups||[];
    let html='<div class="group-list">';
    groups.forEach((g,i)=>{
        html+=`<div class="group-row"><span class="group-name">${esc(g.name)} (${g.urls.length})</span>
            <button class="btn btn-sm btn-primary" data-group-open="${i}">열기</button>
            <button class="btn-icon-sm" data-group-del="${i}">×</button></div>`;
    });
    html+='</div><div class="group-add"><input type="text" class="setting-input" id="group-name-input" placeholder="새 그룹 이름"><button class="btn btn-sm btn-secondary" id="btn-group-save">현재 선택 저장</button></div>';
    const modal=document.getElementById('todo-full-list');// reuse modal
    modal.innerHTML=html;
    modal.querySelectorAll('[data-group-open]').forEach(b=>b.addEventListener('click',()=>{
        const g=groups[parseInt(b.dataset.groupOpen)];if(g)g.urls.forEach(u=>window.open(u,'_blank'))}));
    modal.querySelectorAll('[data-group-del]').forEach(b=>b.addEventListener('click',()=>{
        groups.splice(parseInt(b.dataset.groupDel),1);persistConfig();openBookmarkGroupModal()}));
    document.getElementById('btn-group-save')?.addEventListener('click',()=>{
        const name=document.getElementById('group-name-input')?.value.trim();if(!name)return;
        const urls=getAllBookmarks().map(b=>b.url);
        groups.push({name,urls});CFG.bookmarkGroups=groups;persistConfig();openBookmarkGroupModal()});
}

// C4: FOCUS MODE
function initFocusMode(){
    if(!CFG.focusCategory)return;
    document.body.classList.add('focus-mode');
    document.querySelectorAll('.folder[data-category]').forEach(card=>{
        if(card.dataset.category!==CFG.focusCategory)card.classList.add('blurred');
    });
}
function toggleFocusMode(cat){
    if(CFG.focusCategory===cat){CFG.focusCategory='';document.body.classList.remove('focus-mode')}
    else{CFG.focusCategory=cat;document.body.classList.add('focus-mode')}
    persistConfig();renderDashboard();
}

// C6: START POMODORO FOR TODO
let pomoTodoName='';
function startPomoForTodo(todo){
    pomoTodoName=todo.text;
    const widget=document.querySelector('.pomodoro-widget');
    if(!widget)return;
    const label=widget.querySelector('.pomo-label');if(label)label.textContent=todo.text.slice(0,12);
    const startBtn=widget.querySelector('.pomo-btn');if(startBtn)startBtn.click();
}

// D1: WEEKLY REPORT
function checkWeeklyReport(){
    const today=new Date();const dow=today.getDay();
    if(dow!==1)return; // Monday only
    const todayStr=today.toISOString().slice(0,10);
    if(CFG.weeklyReportDate===todayStr)return;
    CFG.weeklyReportDate=todayStr;persistConfig();
    generateWeeklyReport();
}
function generateWeeklyReport(){
    const today=new Date();const weekAgo=new Date(today);weekAgo.setDate(weekAgo.getDate()-7);
    const weekStr=weekAgo.toISOString().slice(0,10);
    // Top bookmarks this week
    const weekUsage=Object.entries(USAGE).filter(([k,v])=>v.lastUsed&&v.lastUsed>=weekStr).sort((a,b)=>b[1].count-a[1].count).slice(0,5);
    // Completed todos
    const completedTodos=TODOS.filter(t=>t.done).length;
    // Pomo minutes
    const weekPomo=POMO_STATS.filter(s=>s.date>=weekStr).reduce((sum,s)=>sum+s.minutes,0);
    const report=document.createElement('div');report.className='weekly-report';
    report.innerHTML=`<div class="report-header"><span>📊 주간 리포트</span><button class="report-close">×</button></div>
        <div class="report-body">
        <p>🔖 가장 많이 사용: ${weekUsage.map(([k])=>{
            if(k.startsWith('http://')||k.startsWith('https://')){
                const bm=getAllBookmarks().find(b=>b.url===k);return bm?bm.name:new URL(k).hostname;
            }return k.split('::')[1]||k}).join(', ')||'없음'}</p>
        <p>✅ 완료한 할 일: ${completedTodos}개</p>
        <p>🍅 포모도로: ${weekPomo}분</p>
        <p>🔥 스트릭: ${calcStreak()}일 연속</p>
        </div>`;
    document.body.appendChild(report);
    requestAnimationFrame(()=>report.classList.add('visible'));
    report.querySelector('.report-close').addEventListener('click',()=>{report.classList.remove('visible');setTimeout(()=>report.remove(),300)});
    setTimeout(()=>{report.classList.remove('visible');setTimeout(()=>report.remove(),300)},15000);
}

// D2: STREAK CALCULATOR
function calcStreak(){
    const dates=[...new Set(CFG.todoCompletionDates||[])].sort().reverse();
    if(!dates.length)return 0;
    let streak=0;const today=new Date();
    for(let i=0;i<dates.length;i++){
        const expected=new Date(today);expected.setDate(expected.getDate()-i);
        const expStr=expected.toISOString().slice(0,10);
        if(dates.includes(expStr))streak++;else break;
    }
    return streak;
}
function createStreakContent(){
    const c=document.createElement('div');c.className='streak-content';
    const streak=calcStreak();
    c.innerHTML=`<div class="streak-display"><span class="streak-fire">${streak>0?'🔥':'💤'}</span><span class="streak-num">${streak}</span><span class="streak-label">일 연속 완료</span></div>
        <div class="streak-calendar">${getLast14DaysStreak()}</div>`;
    return c;
}
function getLast14DaysStreak(){
    const dates=CFG.todoCompletionDates||[];let html='';
    for(let i=13;i>=0;i--){
        const d=new Date();d.setDate(d.getDate()-i);const str=d.toISOString().slice(0,10);
        const active=dates.includes(str);const label=d.toLocaleDateString('ko',{weekday:'narrow'});
        html+=`<div class="streak-day${active?' active':''}" title="${str}">${label}</div>`;
    }
    return html;
}

// D3: (Pie chart already implemented in populateStats)

// A1: TIME-BASED USAGE (track hourly patterns)
// Modifies usage tracking to include hour data
// (integrated into usage track fetch in createBookmarkEl)

// A2: DEAD LINK DETECTION (v7.3: persistent fail counter, priority recheck, no false positives)
async function checkDeadLinks(){
    if(!CFG.usageTracking)return;
    const allBM=getAllBookmarks();
    let changed=false;
    const FAIL_THRESHOLD=3; // Must fail 3 consecutive checks across sessions

    // Priority 1: Always recheck currently-flagged dead links first
    const deadUrls=Object.keys(CFG.deadLinks);
    const deadBMs=allBM.filter(bm=>deadUrls.includes(bm.url));

    // Priority 2: Random sample of remaining bookmarks
    const aliveBMs=allBM.filter(bm=>!deadUrls.includes(bm.url));
    const shuffled=[...aliveBMs].sort(()=>Math.random()-0.5);
    const sample=[...deadBMs,...shuffled.slice(0,15)];

    for(const bm of sample){
        try{
            const url=new URL(bm.url);
            if(!url.protocol.startsWith('http'))continue;
            await fetch(bm.url,{method:'HEAD',mode:'no-cors',signal:AbortSignal.timeout(12000)});
            // Reachable (opaque response = alive, NOT dead)
            if(CFG.deadLinks[bm.url]){delete CFG.deadLinks[bm.url];changed=true}
            if(CFG._deadLinkFails[bm.url])delete CFG._deadLinkFails[bm.url];
        }catch{
            // Only real failures: DNS error, connection refused, timeout
            const fails=(CFG._deadLinkFails[bm.url]||0)+1;
            CFG._deadLinkFails[bm.url]=fails;
            if(fails>=FAIL_THRESHOLD&&!CFG.deadLinks[bm.url]){
                CFG.deadLinks[bm.url]=true;changed=true;
            }
        }
    }
    // Clean up fail counters for URLs no longer in bookmarks
    const allUrls=new Set(allBM.map(b=>b.url));
    for(const u of Object.keys(CFG._deadLinkFails)){if(!allUrls.has(u))delete CFG._deadLinkFails[u]}
    for(const u of Object.keys(CFG.deadLinks)){if(!allUrls.has(u))delete CFG.deadLinks[u]}
    persistConfig();
}

// C3: BOOKMARK GROUPS
function addBookmarkGroup(name){
    const sel=[...multiSelected].map(k=>{const[cat,idx]=k.split('::');return BM[cat]?.[parseInt(idx)]}).filter(Boolean);
    if(!sel.length){const page=curPage();sel.push(...getAllBookmarks().slice(0,5))}
    CFG.bookmarkGroups.push({name,urls:sel.map(b=>b.url)});persistConfig();
}

// E3: DATA INTEGRITY CHECK
function validateData(){
    let fixed=false;
    // Ensure BM is object
    if(typeof BM!=='object'||Array.isArray(BM)){BM={};fixed=true}
    // Ensure arrays
    if(!Array.isArray(NOTES)&&typeof NOTES!=='object'){NOTES={};fixed=true}
    if(!Array.isArray(TODOS)){TODOS=[];fixed=true}
    if(!Array.isArray(DDAYS)){DDAYS=[];fixed=true}
    if(!Array.isArray(EVENTS)){EVENTS=[];fixed=true}
    if(!Array.isArray(TRASH)){TRASH=[];fixed=true}
    // Fix todo structure
    TODOS.forEach(t=>{
        if(!t.id)t.id=genId();
        if(typeof t.text!=='string')t.text='';
        if(!Array.isArray(t.subtasks))t.subtasks=[];
        if(!Array.isArray(t.tags))t.tags=[];
        if(typeof t.recurring!=='string')t.recurring='';
        if(!t.cardId)t.cardId=(CFG.todoCards&&CFG.todoCards[0])?CFG.todoCards[0].id:'todo_0';
    });
    // Fix BM structure — use filter (safe, no index mutation bug)
    Object.keys(BM).forEach(cat=>{
        if(!Array.isArray(BM[cat])){BM[cat]=[];fixed=true;return}
        const before=BM[cat].length;
        BM[cat]=BM[cat].filter(item=>item&&item.name&&item.url);
        if(BM[cat].length!==before)fixed=true;
    });
    // Fix EVENTS — filter out invalid entries
    const evBefore=EVENTS.length;
    EVENTS=EVENTS.filter(e=>e&&e.id&&e.date);
    if(EVENTS.length!==evBefore)fixed=true;
    // Fix TRASH — filter out corrupted entries
    const trBefore=TRASH.length;
    TRASH=TRASH.filter(i=>i&&i.name&&i.deletedAt);
    if(TRASH.length!==trBefore)fixed=true;
    if(fixed){console.warn('[Integrity] Data repaired');persistBM();persistTodos();persistEvents();persistTrash()}
}

// E4: REDUCE MOTION / PERFORMANCE MODE
function applyReduceMotion(){
    document.documentElement.classList.toggle('reduce-motion',!!CFG.reduceMotion);
}

// B3: WEEKLY VIEW (logic integrated in createCalendarCard)

// D4: EXPORT FORMATS (integrated in doExport)

// D1: WEEKLY REPORT (functions above)

// ====================================================================
//  v6.0 SETTINGS UI ADDITIONS
// ====================================================================
document.addEventListener('DOMContentLoaded',()=>{
    // B2: List view toggle live preview
    document.getElementById('chk-list-view')?.addEventListener('change',e=>{CFG.listView=e.target.checked;persistConfig();renderDashboard()});
    // E4: Reduce motion
    document.getElementById('chk-reduce-motion')?.addEventListener('change',e=>{CFG.reduceMotion=e.target.checked;applyReduceMotion();persistConfig()});
});

// ====================================================================
//  v7.0 FEATURES
// ====================================================================

// A3: SMART PASTE (Ctrl+V URL → auto-detect + add)
function initSmartPaste(){
    document.addEventListener('paste',e=>{
        const tag=e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||e.target.isContentEditable)return;
        const text=(e.clipboardData||window.clipboardData).getData('text').trim();
        if(!text.startsWith('http'))return;
        e.preventDefault();
        try{const u=new URL(text);const hostname=u.hostname.replace('www.','');
            // Show quick category picker
            showSmartPastePopup(text,hostname);
        }catch{}
    });
}
function showSmartPastePopup(url,hostname){
    const existing=document.querySelector('.smart-paste-popup');if(existing)existing.remove();
    const popup=document.createElement('div');popup.className='smart-paste-popup';
    const cats=Object.keys(BM);
    let html=`<div class="sp-header"><span class="sp-icon-wrap"></span><span class="sp-url">${hostname}</span></div>`;
    html+=`<input type="text" class="sp-name-input setting-input" value="${hostname}" placeholder="이름">`;
    html+=`<div class="sp-cats">`;
    cats.forEach(cat=>{html+=`<button class="sp-cat-btn" data-cat="${esc(cat)}">${esc(cat)}</button>`});
    html+=`</div>`;
    popup.innerHTML=html;document.body.appendChild(popup);
    const spIconWrap=popup.querySelector('.sp-icon-wrap');
    if(spIconWrap)resolveIcon(url,spIconWrap,hostname);
    requestAnimationFrame(()=>popup.classList.add('visible'));
    popup.querySelector('.sp-name-input').focus();
    popup.querySelectorAll('.sp-cat-btn').forEach(btn=>btn.addEventListener('click',()=>{
        const cat=btn.dataset.cat;const name=popup.querySelector('.sp-name-input')?.value.trim()||hostname;
        if(!BM[cat])BM[cat]=[];
        BM[cat].push({name,url,addedAt:new Date().toISOString()});
        persistBM();renderDashboard();popup.remove();
        showUndo(`"${name}" → ${cat} 추가됨`,null);
    }));
    setTimeout(()=>document.addEventListener('click',e=>{if(!popup.contains(e.target))popup.remove()},{once:true}),50);
}

// A6: INLINE BOOKMARK EDITING (double-click to edit)
function initInlineEdit(){
    document.addEventListener('dblclick',e=>{
        const bm=e.target.closest('.bookmark-item');if(!bm)return;
        e.preventDefault();e.stopPropagation();
        const cat=bm.dataset.category;const idx=parseInt(bm.dataset.index);
        const item=BM[cat]?.[idx];if(!item)return;
        const nameEl=bm.querySelector('.bookmark-name');if(!nameEl)return;
        nameEl.contentEditable=true;nameEl.focus();
        nameEl.classList.add('inline-editing');
        const save=()=>{nameEl.contentEditable=false;nameEl.classList.remove('inline-editing');
            const newName=nameEl.textContent.trim();if(newName&&newName!==item.name){item.name=newName;persistBM()}};
        nameEl.addEventListener('blur',save,{once:true});
        nameEl.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();nameEl.blur()}if(ev.key==='Escape'){nameEl.textContent=item.name;nameEl.blur()}});
    });
}

// B2: RECURRING EVENTS
function generateRecurringEvents(template){
    const maxInstances=12;
    for(let i=1;i<=maxInstances;i++){
        const d=new Date(template.date);
        if(template.recurring==='매주')d.setDate(d.getDate()+7*i);
        else if(template.recurring==='격주')d.setDate(d.getDate()+14*i);
        else if(template.recurring==='매월')d.setMonth(d.getMonth()+i);
        else continue;
        EVENTS.push({id:Date.now()+i,name:template.name,date:d.toISOString().slice(0,10),color:template.color,startTime:template.startTime,endTime:template.endTime,recurring:'',parentRecurring:template.recurring});
    }
}

// B3: EVENT NOTIFICATIONS
function initEventNotifications(){
    if(!CFG.eventNotifications)return;
    if(!('Notification' in window))return;
    if(Notification.permission==='default'){
        // Show friendly prompt before requesting browser permission
        // Delay to avoid overwhelming user on first boot
        setTimeout(()=>{
            if(Notification.permission!=='default')return; // Already resolved
            showUndo('일정 알림을 받으려면 브라우저 권한이 필요합니다',null);
            // Request after a brief pause so user sees the toast first
            setTimeout(()=>{Notification.requestPermission()},2000);
        },10000); // Wait 10 seconds after boot
    }
    // Check events every minute
    safeSetInterval(checkUpcomingEvents,60000);
    checkUpcomingEvents();
}
function checkUpcomingEvents(){
    if(Notification.permission!=='granted')return;
    const now=new Date();const todayStr=now.toISOString().slice(0,10);
    const nowMin=now.getHours()*60+now.getMinutes();
    EVENTS.filter(ev=>ev.date===todayStr&&ev.startTime).forEach(ev=>{
        const[h,m]=ev.startTime.split(':').map(Number);const evMin=h*60+m;
        const diff=evMin-nowMin;
        if(diff>=9&&diff<=11){// 10 minutes before
            new Notification(`📅 ${ev.name}`,{body:`${ev.startTime}에 시작 (10분 전)`,icon:'/assets/icon-192.png',tag:'event-'+ev.id});
        }
    });
}
function scheduleEventNotification(ev){
    if(!CFG.eventNotifications||Notification.permission!=='granted')return;
    const eventDate=new Date(ev.date+'T'+ev.startTime);
    const notifyTime=eventDate.getTime()-10*60*1000;
    const delay=notifyTime-Date.now();
    if(delay>0&&delay<86400000){// within 24h
        setTimeout(()=>{new Notification(`📅 ${ev.name}`,{body:`${ev.startTime}에 시작 (10분 전)`,icon:'/assets/icon-192.png',tag:'event-'+ev.id})},delay);
    }
}

// C1: KANBAN BOARD VIEW
function renderTodoKanban(){
    const c=document.getElementById('todo-full-list');c.innerHTML='';
    const kanban=document.createElement('div');kanban.className='kanban-board';
    const columns=[
        {name:'예정',filter:t=>!t.done&&!t.inProgress,icon:'📋'},
        {name:'진행 중',filter:t=>!t.done&&t.inProgress,icon:'🔄'},
        {name:'완료',filter:t=>t.done,icon:'✅'}
    ];
    columns.forEach(col=>{
        const colEl=document.createElement('div');colEl.className='kanban-col';
        colEl.innerHTML=`<div class="kanban-header">${col.icon} ${col.name} <span class="kanban-count">${TODOS.filter(col.filter).length}</span></div>`;
        const list=document.createElement('div');list.className='kanban-list';list.dataset.status=col.name;
        // Drag drop
        list.addEventListener('dragover',e=>{e.preventDefault();list.classList.add('kanban-drop-target')});
        list.addEventListener('dragleave',()=>list.classList.remove('kanban-drop-target'));
        list.addEventListener('drop',e=>{list.classList.remove('kanban-drop-target');
            const todoId=parseInt(e.dataTransfer.getData('text/plain'));const todo=TODOS.find(t=>t.id===todoId);if(!todo)return;
            if(col.name==='예정'){todo.done=false;todo.inProgress=false}
            else if(col.name==='진행 중'){todo.done=false;todo.inProgress=true}
            else{todo.done=true;todo.inProgress=false;
                // Record completion + celebration
                const today=new Date().toISOString().slice(0,10);
                if(!CFG.todoCompletionDates.includes(today)){CFG.todoCompletionDates.push(today);persistConfig()}
                checkTodoCompletion();
            }
            persistTodos();renderTodoKanban();renderDashboard()});
        TODOS.filter(col.filter).forEach(t=>{
            const card=document.createElement('div');card.className='kanban-card';card.draggable=true;
            card.dataset.todoId=t.id;
            const priColors=['','#f87171','#fbbf24','#4ade80'];
            card.innerHTML=`<div class="kc-top">${t.priority?'<span class="kc-pri" style="background:'+priColors[t.priority]+'"></span>':''}${t.tags?.map(tag=>'<span class="kc-tag">'+esc(tag)+'</span>').join('')||''}</div><div class="kc-text">${esc(t.text||'(비어있음)')}</div>${t.dueDate?'<div class="kc-due">'+esc(t.dueDate)+'</div>':''}`;
            card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',t.id);card.classList.add('dragging')});
            card.addEventListener('dragend',()=>card.classList.remove('dragging'));
            list.appendChild(card);
        });
        colEl.appendChild(list);kanban.appendChild(colEl);
    });
    // Toggle view button
    const viewToggle=document.createElement('div');viewToggle.className='kanban-toggle';
    viewToggle.innerHTML=`<button class="btn btn-sm btn-secondary" id="kanban-list-toggle">📋 리스트 뷰</button><button class="btn btn-sm btn-primary" id="kanban-board-toggle">📊 칸반 뷰</button>`;
    c.appendChild(viewToggle);c.appendChild(kanban);
    document.getElementById('kanban-list-toggle')?.addEventListener('click',()=>renderTodoFull());
    // Add button
    const addBtn=document.createElement('button');addBtn.className='todo-add';addBtn.style.marginTop='12px';addBtn.textContent='+ 할 일 추가';
    addBtn.addEventListener('click',()=>{TODOS.push({id:Date.now(),text:'',done:false,priority:0,dueDate:'',tags:[],subtasks:[],recurring:'',inProgress:false,cardId:(CFG.todoCards[0]||{id:'todo_0'}).id});persistTodos();renderTodoKanban();renderDashboard()});
    c.appendChild(addBtn);
}

// C2: TODO FILTER & SEARCH
function renderTodoFull(){
    const c=document.getElementById('todo-full-list');c.innerHTML='';
    // Filter bar
    const filterBar=document.createElement('div');filterBar.className='todo-filter-bar';
    filterBar.innerHTML=`<input type="text" class="setting-input todo-search-input" placeholder="🔍 검색..." id="todo-search">
        <select class="setting-input" id="todo-filter-tag"><option value="">전체 태그</option>${(CFG.todoTags||[]).map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('')}</select>
        <select class="setting-input" id="todo-filter-pri"><option value="">전체 우선순위</option><option value="1">🔴 높음</option><option value="2">🟡 중간</option><option value="3">🟢 낮음</option></select>
        <button class="btn btn-sm btn-secondary" id="todo-kanban-toggle">📊 칸반</button>`;
    c.appendChild(filterBar);
    const applyFilter=()=>{
        const q=document.getElementById('todo-search')?.value.toLowerCase()||'';
        const tag=document.getElementById('todo-filter-tag')?.value||'';
        const pri=document.getElementById('todo-filter-pri')?.value||'';
        const list=c.querySelector('.todo-full-items');if(!list)return;list.innerHTML='';
        let filtered=[...TODOS.filter(t=>!t.done),...TODOS.filter(t=>t.done)];
        if(q)filtered=filtered.filter(t=>t.text.toLowerCase().includes(q));
        if(tag)filtered=filtered.filter(t=>t.tags?.includes(tag));
        if(pri)filtered=filtered.filter(t=>String(t.priority)===pri);
        filtered.forEach(t=>list.appendChild(createTodoItem(t)));
    };
    const list=document.createElement('div');list.className='todo-full-items';c.appendChild(list);
    const sorted=[...TODOS.filter(t=>!t.done),...TODOS.filter(t=>t.done)];
    sorted.forEach(t=>list.appendChild(createTodoItem(t)));
    // Events
    filterBar.querySelector('#todo-search')?.addEventListener('input',applyFilter);
    filterBar.querySelector('#todo-filter-tag')?.addEventListener('change',applyFilter);
    filterBar.querySelector('#todo-filter-pri')?.addEventListener('change',applyFilter);
    filterBar.querySelector('#todo-kanban-toggle')?.addEventListener('click',()=>renderTodoKanban());
    const addBtn=document.createElement('button');addBtn.className='todo-add';addBtn.textContent='+ 할 일 추가';
    addBtn.addEventListener('click',()=>{TODOS.push({id:Date.now(),text:'',done:false,priority:0,dueDate:'',tags:[],subtasks:[],recurring:'',inProgress:false,cardId:(CFG.todoCards[0]||{id:'todo_0'}).id});persistTodos();renderTodoFull();renderDashboard()});c.appendChild(addBtn);
}

// C3: COMPLETION CELEBRATION (confetti)
function checkTodoCompletion(){
    const total=TODOS.length;if(total===0)return;
    const done=TODOS.filter(t=>t.done).length;
    if(done===total)triggerConfetti();
}
function triggerConfetti(){
    const canvas=document.createElement('canvas');canvas.className='confetti-canvas';canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    document.body.appendChild(canvas);const ctx=canvas.getContext('2d');
    const particles=[];const colors=['#f87171','#fbbf24','#4ade80','#6ea8fe','#a78bfa','#f472b6','#22d3ee'];
    for(let i=0;i<150;i++){particles.push({x:Math.random()*canvas.width,y:-20-Math.random()*200,w:Math.random()*8+4,h:Math.random()*6+2,
        vx:(Math.random()-0.5)*4,vy:Math.random()*4+2,rot:Math.random()*360,rotV:(Math.random()-0.5)*10,
        color:colors[Math.floor(Math.random()*colors.length)],life:1})}
    let frame=0;const maxFrames=180;
    const animate=()=>{if(frame>maxFrames){canvas.remove();return}frame++;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.rot+=p.rotV;p.life=Math.max(0,1-(frame/maxFrames));
            ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.life;
            ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()});
        requestAnimationFrame(animate)};
    animate();
}

// D1: CARD BACKGROUND GRADIENTS
function applyCardGradients(){
    document.querySelectorAll('.folder[data-category]').forEach(card=>{
        const color=CFG.cardColors[card.dataset.category];
        if(color){card.style.setProperty('--card-grad-color',color+'20');card.classList.add('has-gradient')}
    });
}

// D2: MICRO-INTERACTIONS
function addRipple(e){
    const el=e.currentTarget;const ripple=document.createElement('span');ripple.className='ripple-effect';
    const rect=el.getBoundingClientRect();ripple.style.left=(e.clientX-rect.left)+'px';ripple.style.top=(e.clientY-rect.top)+'px';
    el.appendChild(ripple);setTimeout(()=>ripple.remove(),600);
}

// D3: LAYOUT PRESETS
function applyLayoutPreset(){
    const preset=CFG.layoutPreset||'default';
    document.documentElement.setAttribute('data-layout',preset);
}
function cycleLayoutPreset(){
    const presets=['default','compact','wide','magazine'];
    const idx=presets.indexOf(CFG.layoutPreset||'default');
    CFG.layoutPreset=presets[(idx+1)%presets.length];
    applyLayoutPreset();persistConfig();renderDashboard();
    showUndo(`레이아웃: ${CFG.layoutPreset}`,null);
}

// E1: DAILY PLANNER VIEW
function openDailyPlanner(){
    const modal=document.getElementById('todo-full-list');
    const today=new Date().toISOString().slice(0,10);const todayLabel=new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'});
    let html=`<div class="daily-planner">`;
    html+=`<h3 class="dp-title">📅 ${todayLabel}</h3>`;
    // D-Days
    const todayDdays=DDAYS.filter(d=>{const diff=Math.ceil((new Date(d.date)-new Date().setHours(0,0,0,0))/864e5);return diff>=0&&diff<=7});
    if(todayDdays.length){html+=`<div class="dp-section"><div class="dp-label">📌 D-Day</div>`;todayDdays.forEach(d=>{const diff=Math.ceil((new Date(d.date)-new Date().setHours(0,0,0,0))/864e5);html+=`<div class="dp-item">${esc(d.label)} <span class="dp-badge">${diff===0?'D-Day':'D-'+diff}</span></div>`});html+=`</div>`}
    // Events
    const todayEvents=EVENTS.filter(ev=>ev.date===today).sort((a,b)=>(a.startTime||'99:99').localeCompare(b.startTime||'99:99'));
    if(todayEvents.length){html+=`<div class="dp-section"><div class="dp-label">📅 일정</div>`;todayEvents.forEach(ev=>{html+=`<div class="dp-item"><span class="dp-time">${ev.startTime||'종일'}</span>${ev.endTime?' - '+ev.endTime:''} ${esc(ev.name)}</div>`});html+=`</div>`}
    // Todos
    const todayTodos=TODOS.filter(t=>!t.done&&(!t.dueDate||t.dueDate<=today));
    html+=`<div class="dp-section"><div class="dp-label">📋 할 일 (${todayTodos.length})</div>`;
    todayTodos.forEach(t=>{html+=`<div class="dp-item dp-todo">${t.done?'✅':'☐'} ${esc(t.text)} ${t.dueDate===''+today?'<span class="dp-badge dp-today">오늘</span>':t.dueDate?'<span class="dp-badge">'+esc(t.dueDate)+'</span>':''}</div>`});
    html+=`</div>`;
    // Pomodoro
    html+=`<div class="dp-section"><div class="dp-label">🍅 포모도로</div><div class="dp-pomo-today">오늘 집중: <b>${POMO_STATS.filter(s=>s.date===today).reduce((sum,s)=>sum+s.minutes,0)}분</b></div></div>`;
    // Habits
    if(CFG.habits.length){html+=`<div class="dp-section"><div class="dp-label">✅ 습관</div>`;
        CFG.habits.forEach((h,i)=>{const checked=CFG.habitLog[today]?.includes(i);
            html+=`<div class="dp-item dp-habit" data-habit="${i}"><span class="dp-habit-check${checked?' active':''}">${checked?'✓':''}</span> ${esc(h)}</div>`});
        html+=`</div>`}
    html+=`</div>`;
    modal.innerHTML=html;
    modal.querySelectorAll('.dp-habit').forEach(el=>el.addEventListener('click',()=>{
        const hi=parseInt(el.dataset.habit);toggleHabit(hi);openDailyPlanner();renderDashboard()}));
    openModal('modal-todo-full');
}

// E2: HABIT TRACKER
function checkHabitsToday(){openDailyPlanner()}
function toggleHabit(habitIdx){
    const today=new Date().toISOString().slice(0,10);
    if(!CFG.habitLog[today])CFG.habitLog[today]=[];
    const idx=CFG.habitLog[today].indexOf(habitIdx);
    if(idx>=0)CFG.habitLog[today].splice(idx,1);else CFG.habitLog[today].push(habitIdx);
    persistConfig();
}
function createHabitCard(){
    const card=document.createElement('div');card.className='card-common habit-card';
    const key='__habits';
    if(CFG.collapsedCategories.includes(key))card.classList.add('collapsed');
    const title=document.createElement('div');title.className='card-title';
    title.innerHTML='<span class="collapse-arrow">▼</span><span class="card-title-text">✅ 습관</span><div class="card-title-btns"><div class="card-edit-btns"><button class="card-edit-btn danger widget-remove-btn" title="카드 제거">×</button></div></div>';
    title.addEventListener('click',e=>{if(e.target.closest('.card-edit-btns'))return;card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(key))CFG.collapsedCategories.push(key)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==key)}persistConfig()});
    title.querySelector('.widget-remove-btn').addEventListener('click',e=>{e.stopPropagation();CFG.showHabit=false;persistConfig();renderDashboard();showUndo('"습관" 카드 제거됨',()=>{CFG.showHabit=true;persistConfig();renderDashboard()})});
    card.appendChild(title);
    const list=document.createElement('div');list.className='habit-list';
    const today=new Date().toISOString().slice(0,10);
    const todayLog=CFG.habitLog[today]||[];
    if(!CFG.habits.length){list.innerHTML='<p style="font-size:.75rem;color:var(--text-muted)">설정에서 습관을 추가하세요</p>'}
    else{CFG.habits.forEach((h,i)=>{
        const row=document.createElement('div');row.className='habit-row';
        const checked=todayLog.includes(i);
        row.innerHTML=`<button class="habit-check${checked?' checked':''}">${checked?'✓':''}</button><span class="habit-name">${esc(h)}</span><span class="habit-streak">${getHabitStreak(i)}🔥</span>`;
        row.querySelector('.habit-check').addEventListener('click',()=>{toggleHabit(i);renderDashboard()});
        list.appendChild(row);
    })}
    // 7-day overview
    const overview=document.createElement('div');overview.className='habit-overview';
    for(let d=6;d>=0;d--){const date=new Date();date.setDate(date.getDate()-d);const ds=date.toISOString().slice(0,10);
        const log=CFG.habitLog[ds]||[];const pct=CFG.habits.length?Math.round(log.length/CFG.habits.length*100):0;
        const label=date.toLocaleDateString('ko',{weekday:'narrow'});
        overview.innerHTML+=`<div class="habit-day-col"><div class="habit-bar" style="height:${Math.max(4,pct*0.6)}px;${pct===100?'background:var(--success)':''}"></div><span class="habit-day-label">${label}</span></div>`}
    list.appendChild(overview);
    card.appendChild(list);return card;
}
function getHabitStreak(habitIdx){
    let streak=0;
    for(let d=0;d<365;d++){const date=new Date();date.setDate(date.getDate()-d);const ds=date.toISOString().slice(0,10);
        if(CFG.habitLog[ds]?.includes(habitIdx))streak++;else break}
    return streak;
}

// E5: AUTO POMODORO SESSIONS
function startCustomPomo(minutes){
    const widget=document.querySelector('.pomodoro-widget');if(!widget)return;
    // Find or create pomo controls
    let timeEl=widget.querySelector('.pomo-time');
    if(!timeEl)return;
    // Dispatch start with custom duration
    const evt=new CustomEvent('startPomo',{detail:{minutes}});document.dispatchEvent(evt);
}
// Pomodoro card (rendered in dashboard bottom section)
function createPomodoroCard(){
    const card=document.createElement('div');card.className='card-common pomo-card';
    const key='__pomodoro';
    if(CFG.collapsedCategories?.includes(key))card.classList.add('collapsed');
    const title=document.createElement('div');title.className='card-title';
    title.innerHTML='<span class="collapse-arrow">▼</span><span class="card-title-text">🍅 포모도로</span>';
    title.addEventListener('click',e=>{if(e.target.closest('.card-edit-btns'))return;card.classList.toggle('collapsed');
        if(card.classList.contains('collapsed')){if(!CFG.collapsedCategories.includes(key))CFG.collapsedCategories.push(key)}
        else{CFG.collapsedCategories=CFG.collapsedCategories.filter(c=>c!==key)}persistConfig()});
    card.appendChild(title);
    const widget=document.createElement('div');widget.className='pomodoro-widget';
    widget.innerHTML=`<span class="pomo-label">${esc(pomoTodoName||'집중')}</span><span class="pomo-time">25:00</span><button class="pomo-btn">▶</button>`;
    card.appendChild(widget);
    // Init timer after DOM insertion
    // Delay to ensure DOM is fully attached before querying widget
    requestAnimationFrame(()=>setTimeout(()=>initPomodoroTimer(),0));
    return card;
}

let pomoInterval=null;let pomoRemaining=0;let pomoTotal=0;let pomoIsBreak=false;
function initPomodoroTimer(){
    const widget=document.querySelector('.pomodoro-widget');if(!widget)return;
    const timeEl=widget.querySelector('.pomo-time');
    const startBtn=widget.querySelector('.pomo-btn');if(!startBtn||!timeEl)return;
    function pomoTick(){
        pomoRemaining--;
        const m=Math.floor(pomoRemaining/60);const s=pomoRemaining%60;
        timeEl.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        updatePomoDisplay(pomoRemaining,pomoTotal,pomoIsBreak);
        if(pomoRemaining<=0){
            clearInterval(pomoInterval);pomoInterval=null;
            if(!pomoIsBreak){
                recordPomoSession(Math.round(pomoTotal/60));
                CFG.pomoSessionCount++;
                // E5: Auto session
                if(CFG.pomoAutoSession){
                    const isLongBreak=CFG.pomoSessionCount%4===0;
                    pomoIsBreak=true;pomoTotal=(isLongBreak?15:5)*60;pomoRemaining=pomoTotal;
                    startBtn.textContent='⏸';showUndo(isLongBreak?'☕ 긴 휴식 15분':'☕ 짧은 휴식 5분',null);
                    pomoInterval=setInterval(pomoTick,1000);
                } else {startBtn.textContent='▶';showUndo('🍅 포모도로 완료!',null)}
                persistConfig();
            } else {
                pomoIsBreak=false;
                if(CFG.pomoAutoSession){pomoTotal=25*60;pomoRemaining=pomoTotal;startBtn.textContent='⏸';showUndo('🍅 집중 시작!',null);pomoInterval=setInterval(pomoTick,1000)}
                else{startBtn.textContent='▶';showUndo('☕ 휴식 완료!',null)}
            }
        }
    }
    startBtn.addEventListener('click',()=>{
        if(pomoInterval){clearInterval(pomoInterval);pomoInterval=null;startBtn.textContent='▶';return}
        pomoTotal=25*60;pomoRemaining=pomoTotal;pomoIsBreak=false;
        CFG.pomoSessionCount=(CFG.pomoSessionCount||0);
        startBtn.textContent='⏸';
        pomoInterval=setInterval(pomoTick,1000);
    });
    // Custom duration event
    document.addEventListener('startPomo',e=>{
        if(pomoInterval)clearInterval(pomoInterval);
        const mins=e.detail?.minutes||25;pomoTotal=mins*60;pomoRemaining=pomoTotal;pomoIsBreak=false;
        startBtn.textContent='⏸';startBtn.click();
    });
}

// ====================================================================
//  v7.0 DASHBOARD RENDER (add habit card)
// ====================================================================
