// === Config ===
const CONFIG = {
    githubUser: "Mubarek-Amin",
    includeRepos: true,
    pinned: [],
};


// Theme toggle
const btn = document.getElementById('themeToggle');
btn?.addEventListener('click', () => document.documentElement.classList.toggle('dark'));


// Year
document.getElementById('year')?.append(new Date().getFullYear());


// State
let allProjects = [];
let activeTag = 'All';


// Render tag filters
function renderFilters(tags) {
    const el = document.getElementById('projectFilters');
    const unique = ['All', ...Array.from(new Set(tags))].sort((a, b) => a.localeCompare(b));
    el.innerHTML = unique.map(t => `
<button class="chip ${t === activeTag ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : ''}" data-tag="${t}">${t}</button>
`).join('');
    el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { activeTag = b.dataset.tag; renderProjects(); renderFilters(tags); }));
}


// Render project cards
function renderProjects() {
    const grid = document.getElementById('projectGrid');
    const data = activeTag === 'All' ? allProjects : allProjects.filter(p => (p.tags || []).includes(activeTag));
    if (!data.length) {
        grid.innerHTML = `<p class="text-sm text-zinc-500">No projects for “${activeTag}”.</p>`;
        return;
    }
    grid.innerHTML = data.map(p => `
<article class="card hover:shadow">
<div class="flex items-center justify-between">
<h3 class="font-semibold text-lg">${p.title}</h3>
${typeof p.stars === 'number' ? `<span aria-label="Stars">⭐ ${p.stars}</span>` : ''}
</div>
<p class="mt-2 text-sm text-zinc-400">${p.summary ?? ''}</p>
<div class="mt-3 flex flex-wrap gap-2">
${(p.tags || []).map(t => `<span class="chip">${t}</span>`).join('')}
</div>
<div class="mt-4 flex gap-3 text-sm items-center">
${p.links?.github ? `<a class="underline" href="${p.links.github}" target="_blank" rel="noopener">GitHub</a>` : ''}
${p.links?.demo ? `<a class="underline" href="${p.links.demo}" target="_blank" rel="noopener">Demo</a>` : ''}
${p.updated ? `<span title="Last updated">· Updated ${new Date(p.updated).toLocaleDateString()}</span>` : ''}
</div>
</article>
`).join('');
}

// Merge helper (avoid duplicates by title/github URL)
function mergeProjects(staticProjects, repoProjects) {
  const seen = new Set();
  const out = [];
  const push = (p) => {
    const k = p.links?.github || p.title;
    if (!seen.has(k)) { seen.add(k); out.push(p); }
  };

  // Pinned repos first
  const pinnedSet = new Set((CONFIG.pinned || []).map(s => s.toLowerCase()));
  const pinned = repoProjects.filter(r => pinnedSet.has(r.repoName.toLowerCase()));
  pinned.forEach(push);

  // Then static entries
  staticProjects.forEach(push);

  // Then remaining repos
  repoProjects
    .filter(r => !pinnedSet.has(r.repoName.toLowerCase()))
    .forEach(push);

  return out;
}

// Load static projects.json
async function loadStaticProjects() {
  try {
    const res = await fetch('/data/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return json.map(p => ({ ...p }));
  } catch (e) {
    console.warn('No or invalid projects.json', e);
    return [];
  }
}

// Load GitHub repos for user
async function loadGitHubRepos(user) {
  if (!user) return [];
  try {
    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`,
      { headers }
    );
    if (!res.ok) throw new Error('GitHub HTTP ' + res.status);
    const repos = await res.json();

    return repos
      .filter(r => !r.archived)
      .map(r => ({
        title: r.name,
        repoName: r.name,
        summary: r.description || '',
        tags: [r.language, ...(r.topics || [])].filter(Boolean),
        stars: r.stargazers_count,
        updated: r.pushed_at,
        links: { github: r.html_url, demo: r.homepage || undefined }
      }));
  } catch (e) {
    console.error('Failed to load GitHub repos', e);
    return [];
  }
}



// Scroll reveal
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: 0.1 });


document.querySelectorAll('.reveal').forEach(el => io.observe(el));


// Boot
async function init() {
    const staticProjects = await loadStaticProjects();
    const repoProjects = CONFIG.includeRepos ? await loadGitHubRepos(CONFIG.githubUser) : [];
    allProjects = mergeProjects(staticProjects, repoProjects);
    const tags = allProjects.flatMap(p => p.tags || []);
    renderFilters(tags);
    renderProjects();
}
init();
