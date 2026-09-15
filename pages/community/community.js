// Community Forum Page Logic

let currentCategory = 'all';
let communityPosts = [];

// Demo posts
const demoPosts = [
  {
    id: 'post_001', author: 'Rajesh Patil', avatar: 'RP', category: 'pricing',
    title: 'When is the best time to sell onions this season?',
    body: 'Onion prices are fluctuating a lot. Should I hold my stock or sell now? I have 2000kg harvested last week in Nashik.',
    likes: 12, replies: [
      { author: 'Sunita Jadhav', avatar: 'SJ', text: 'Prices usually go up in October-November. If you have good storage, wait 2-3 weeks.', time: '2 hours ago' },
      { author: 'Kishor Agro (Trader)', avatar: 'KA', text: 'Current Lasalgaon rate is ₹26/kg. We expect ₹30+ by October. Hold if storage is good.', time: '1 hour ago' }
    ],
    time: '4 hours ago', liked: false
  },
  {
    id: 'post_002', author: 'Anita Deshmukh', avatar: 'AD', category: 'millets',
    title: 'Has anyone tried growing Ragi (Finger Millet) in Maharashtra?',
    body: 'I heard there is good government support for millets now under the Shree Anna Mission. Anyone have experience with Ragi cultivation in the Nashik/Pune region?',
    likes: 8, replies: [
      { author: 'Ganesh More', avatar: 'GM', text: 'Yes! I started Ragi last season. Got ₹35/kg MSP support. The soil in Nashik is suitable. Contact your local Krishi Vigyan Kendra for seeds.', time: '5 hours ago' }
    ],
    time: '1 day ago', liked: false
  },
  {
    id: 'post_003', author: 'Manoj Shinde', avatar: 'MS', category: 'schemes',
    title: 'How to apply for PM-KISAN? My 3rd installment is stuck',
    body: 'I applied for PM-KISAN last year but haven\'t received the 3rd installment. Aadhaar is linked. What should I do?',
    likes: 15, replies: [
      { author: 'KisanSetu Support', avatar: 'KS', text: 'Check your status at pmkisan.gov.in. Common issues: Aadhaar-bank mismatch, incorrect land records. Visit your Block Agriculture Office.', time: '3 hours ago' },
      { author: 'Rajesh Patil', avatar: 'RP', text: 'I had the same issue. Go to CSC center with Aadhaar + passbook photocopy. They resolved it in 2 days.', time: '2 hours ago' }
    ],
    time: '2 days ago', liked: false
  },
  {
    id: 'post_004', author: 'Sunita Jadhav', avatar: 'SJ', category: 'cropcare',
    title: 'Tomato leaf curl disease — what organic treatment works?',
    body: 'My tomato plants are showing leaf curl symptoms. I don\'t want to use chemical pesticides. Any organic remedies?',
    likes: 6, replies: [
      { author: 'Dr. Agri Expert', avatar: 'DA', text: 'Neem oil spray (5ml/litre) every 7 days. Also try yellow sticky traps for whiteflies. Remove affected leaves immediately.', time: '6 hours ago' }
    ],
    time: '3 days ago', liked: false
  },
  {
    id: 'post_005', author: 'Ganesh More', avatar: 'GM', category: 'weather',
    title: 'Will the late monsoon rains affect Kharif soybean harvest?',
    body: 'Rain forecasts show continued rainfall in September. My soybean crop is ready for harvest. Should I harvest early?',
    likes: 9, replies: [
      { author: 'Anita Deshmukh', avatar: 'AD', text: 'Harvest as soon as pods turn brown. Even 1-2 days of rain after maturity can cause pod shattering. Cover with tarpaulin after harvesting.', time: '1 day ago' }
    ],
    time: '4 days ago', liked: false
  },
  {
    id: 'post_006', author: 'Ramesh Kumar', avatar: 'RK', category: 'millets',
    title: 'Bajra (Pearl Millet) — getting ₹40/kg at APMC, should I sell?',
    body: 'My Bajra is fetching ₹40/kg at local APMC. The MSP is ₹2500/quintal (₹25/kg). Is ₹40 a good price or should I wait?',
    likes: 11, replies: [
      { author: 'Market Analyst', avatar: 'MA', text: '₹40/kg is excellent for Bajra! Much above MSP. Sell 60-70% now and hold 30% if you have storage.', time: '8 hours ago' }
    ],
    time: '5 days ago', liked: false
  }
];

document.addEventListener('DOMContentLoaded', () => {
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (!user) { App.navigateTo('login'); return; }
      initCommunity();
    });
  } else {
    initCommunity();
  }

  window.addEventListener('languageChanged', () => initCommunity());
});

function initCommunity() {
  const userType = App.getUserType();
  document.getElementById('topNav').innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    ${renderTopNav(userType)}
  `;
  document.getElementById('sidebar').innerHTML = renderDashboardSidebar('community', userType);
  document.getElementById('bottomNav').innerHTML = renderBottomNav('community', userType);
  App.initNavigation();
  App.translatePage();

  // Load posts
  communityPosts = JSON.parse(localStorage.getItem('kisansetu_community_posts') || 'null') || [...demoPosts];
  renderPosts();
}

function filterPosts(category, btn) {
  currentCategory = category;
  document.querySelectorAll('#communityTabs .tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPosts();
}

function renderPosts() {
  const filtered = currentCategory === 'all'
    ? communityPosts
    : communityPosts.filter(p => p.category === currentCategory);

  const container = document.getElementById('postsList');

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>No posts yet</h3>
        <p>Be the first to ask a question!</p>
      </div>
    `;
    return;
  }

  const categoryIcons = {
    pricing: '💰', cropcare: '🌱', weather: '🌦️', schemes: '🏛️', millets: '🌾'
  };

  container.innerHTML = filtered.map(post => `
    <div class="post-card animate-fade">
      <div class="post-header">
        <div class="post-avatar">${post.avatar}</div>
        <div class="post-meta">
          <div class="post-author">${post.author}</div>
          <div class="post-time">${post.time}</div>
        </div>
        <span class="post-category-badge">${categoryIcons[post.category] || '📝'} ${post.category}</span>
      </div>
      <div class="post-title">${post.title}</div>
      <div class="post-body">${post.body}</div>

      ${post.replies && post.replies.length ? `
        <div class="post-replies">
          ${post.replies.map(r => `
            <div class="reply-card">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <div class="post-avatar" style="width:28px;height:28px;font-size:0.7rem;">${r.avatar}</div>
                <span class="reply-author">${r.author}</span>
                <span class="reply-time">· ${r.time}</span>
              </div>
              <div class="reply-text">${r.text}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="post-actions">
        <button class="post-action-btn ${post.liked ? 'liked' : ''}" onclick="likePost('${post.id}')">
          ${post.liked ? '❤️' : '🤍'} ${post.likes}
        </button>
        <button class="post-action-btn" onclick="toggleReply('${post.id}')">
          💬 Reply (${(post.replies || []).length})
        </button>
        <button class="post-action-btn" onclick="sharePost('${post.id}')">
          📤 Share
        </button>
      </div>

      <div class="reply-form" id="replyForm_${post.id}" style="display:none;">
        <input type="text" id="replyInput_${post.id}" class="form-control" placeholder="Write a reply...">
        <button class="btn btn-primary btn-sm" onclick="submitReply('${post.id}')">Reply</button>
      </div>
    </div>
  `).join('');
}

function submitPost(e) {
  e.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const body = document.getElementById('postBody').value.trim();
  const category = document.getElementById('postCategory').value;
  if (!title) return false;

  const user = App.getUser();
  const newPost = {
    id: 'post_' + Date.now(),
    author: user ? user.name : 'Anonymous Farmer',
    avatar: user ? (user.avatar || user.name.charAt(0)) : 'AF',
    category,
    title,
    body,
    likes: 0,
    replies: [],
    time: 'Just now',
    liked: false
  };

  communityPosts.unshift(newPost);
  localStorage.setItem('kisansetu_community_posts', JSON.stringify(communityPosts));
  renderPosts();
  document.getElementById('postForm').reset();
  App.showNotification('Posted! 📝', 'Your question has been shared with the community', 'success');
  return false;
}

function likePost(postId) {
  const post = communityPosts.find(p => p.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  localStorage.setItem('kisansetu_community_posts', JSON.stringify(communityPosts));
  renderPosts();
}

function toggleReply(postId) {
  const form = document.getElementById('replyForm_' + postId);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    if (form.style.display === 'flex') {
      document.getElementById('replyInput_' + postId)?.focus();
    }
  }
}

function submitReply(postId) {
  const input = document.getElementById('replyInput_' + postId);
  const text = input?.value.trim();
  if (!text) return;

  const user = App.getUser();
  const post = communityPosts.find(p => p.id === postId);
  if (!post) return;

  post.replies = post.replies || [];
  post.replies.push({
    author: user ? user.name : 'Anonymous',
    avatar: user ? (user.avatar || user.name.charAt(0)) : 'A',
    text,
    time: 'Just now'
  });

  localStorage.setItem('kisansetu_community_posts', JSON.stringify(communityPosts));
  renderPosts();
  App.showNotification('Reply Sent! 💬', 'Your reply has been posted', 'success');
}

function sharePost(postId) {
  const post = communityPosts.find(p => p.id === postId);
  if (!post) return;
  const shareText = `${post.title}\n\n${post.body}\n\n— via KisanSetu Community`;

  if (navigator.share) {
    navigator.share({ title: post.title, text: shareText }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      App.showNotification('Copied! 📋', 'Post copied to clipboard', 'info');
    });
  }
}
