var hyper = window.hyperHTML
var moment = window.moment
var ZIP = window.JSZip
var darkModeCSS = ``
var licenseMIT = `
  <h4>MIT License</h4>
  <p>Copyright (c) 2017 Karar Al-Remahy</p>
  <p>Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:</p>
  <p>The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.</p>
  <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.</p>
`

var cacheFiles = []
var loading
var cacheChannels = []
var currentZIP

function messageRender (m, u, r) {
  var k = {
    t: m.t ? m.t : m.timestamp,
    m: m.c ? m.c.m : m.content.message,
    e: m.e ? m.e : m.editedTimestamp ? m.editedTimestamp : null,
    u: m.u ? u[m.u] : u[m.userId],
    a: (m.c ? m.c.a : m.content.attachments) || []
  }
  k.c = k.u.r ? ((k.u.r.length > 0) ? r[k.u.r[k.u.r.length - 1]].c : undefined) : (k.u.roles ? ((k.u.roles.length > 0) ? r[k.u.roles[k.u.roles.length - 1]].hexColor : undefined) : undefined)
  var backwardsCompat = (i) => {
    return {
      name: i.n || i.filename,
      url: i.u || i.url
    }
  }
  return hyper.wire()`
    <div class="media d-server-message">
      <figure class="media-left image is-40x40">
        <img src="${k.u.a || k.u.avatar}">
      </figure>
      <div class="media-content">
        <div class="content" style=${{ overflow: 'hidden' }}>
          <p style="word-break:break-word;">
            <strong style=${{ color: k.c }} title="${k.u.tg || k.u.tag}">${(k.u.nn || k.u.nickname) ? k.u.nn || k.u.nickname : k.u.n || k.u.name}</strong> <small title="${moment(m.t || m.timestamp).format()}">${moment(m.t || m.timestamp).fromNow()}</small> ${(m.e || m.edited) ? hyper.wire()`<small title="${moment(m.e || m.edited).format()}"> (edited)</small>` : ''}
            ${k.m.length > 0 ? hyper.wire()`<br><span style=${{ whiteSpace: 'pre-wrap' }}>${k.m}</span>` : ''}
            ${k.a.length > 0 ? k.a.map(i => hyper.wire()`
              ${['webp', 'png', 'gif', 'jpg', 'jpeg', 'apng', 'bmp', 'ico'].includes(backwardsCompat(i).name.toLowerCase().split('.').pop()) ? hyper.wire()`
                <br><a title="${backwardsCompat(i).name}" href="${backwardsCompat(i).url}" target="_blank"><img src="${backwardsCompat(i).url}"></img></a>
              ` : hyper.wire()`<br><a title="${backwardsCompat(i).name}" href="${backwardsCompat(i).url}" target="_blank">${backwardsCompat(i).name}</a>`}
            `) : ''}
          </p>
        </div>
      </div>
    </div>
  `
}

function memberRender (u, r) {
  var backwardsCompat = {
    u: u.a || u.avatar,
    n: u.n || u.name,
    nn: u.nn || u.nickname,
    t: u.t || u.createdTimestamp,
    tg: u.tg || u.tag,
    r: u.r || u.roles
  }
  backwardsCompat.c = backwardsCompat.r ? ((backwardsCompat.r.length > 0) ? r[backwardsCompat.r[backwardsCompat.r.length - 1]].c : undefined) : (backwardsCompat.roles ? ((backwardsCompat.roles.length > 0) ? r[backwardsCompat.roles[backwardsCompat.roles.length - 1]].hexColor : undefined) : undefined)
  return hyper.wire()`
    <li title="${`${backwardsCompat.n} (${backwardsCompat.tg}) ${moment(backwardsCompat.t).format()}`}">
      <a>
        <div class="level is-mobile is-marginless is-paddingless">
          <div class="level-left">
            <figure class="level-item image is-30x30">
              <img src="${backwardsCompat.u}">
            </figure>
            <strong class="level-item" style=${{ color: backwardsCompat.c }}>${backwardsCompat.nn || backwardsCompat.n}</strong>
          </div>
        </div>
      </a>
    </li>
  `
}

function paginationRender (p) {
  if (p.max === 0) {
    document.getElementById('messages').style.height = 'calc(100vh - 48px)'
    document.querySelector('.d-server-channel-messages-wrapper').nextElementSibling.classList.add('is-hidden')
  } else {
    document.getElementById('messages').style.height = 'calc(100vh - 144px)'
    document.querySelector('.d-server-channel-messages-wrapper').nextElementSibling.classList.remove('is-hidden')
  }
  return hyper.wire()`
    ${p.max > 3 ? hyper.wire()`
      <li>
        <a class="pagination-link" data-id="${p.id}" data-f="0" onclick=${loadChannel}>First file (0)</a>
      </li>
      <li>
        <a class="${`pagination-link${p.c === 0 ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c > 0 ? (p.c < p.max ? p.c - 1 : p.c - 2) : '0'}" onclick=${loadChannel}>&lt; (${p.c > 0 ? (p.c < p.max ? p.c - 1 : p.c - 2) : '0'})</a>
      </li>
      <li>
        <a class="${`pagination-link${(p.c > 0 && p.c < p.max) ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c > 0 ? (p.c < p.max ? p.c : p.c - 1) : p.c + 1}" onclick=${loadChannel}>(${p.c > 0 ? (p.c < p.max ? p.c : p.c - 1) : p.c + 1})</a>
      </li>
      <li>
        <a class="${`pagination-link${p.c === p.max ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c > 0 ? (p.c < p.max ? p.c + 1 : p.max) : p.c + 2}" onclick=${loadChannel}>(${p.c > 0 ? (p.c < p.max ? p.c + 1 : p.max) : p.c + 2}) &gt;</a>
      </li>
      <li>
        <a class="pagination-link" data-id="${p.id}" data-f="${p.max}" onclick=${loadChannel}>Last file (${p.max})</a>
      </li>
    ` : hyper.wire()`
      <li>
        <a class="${`pagination-link${p.c === 0 ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c > 0 ? (p.c < p.max ? p.c - 1 : p.c - 2) : '0'}" onclick=${loadChannel}>(${p.c > 0 ? (p.c < p.max ? p.c - 1 : p.c - 2) : '0'})</a>
      </li>
      ${p.max > 1 ? hyper.wire()`
        <li>
          <a class="${`pagination-link${(p.c > 0 && p.c < p.max) ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c < p.max ? p.c : p.c - 1}" onclick=${loadChannel}>(${p.c < p.max ? p.c : p.c - 1})</a>
        </li>
      ` : ''}
      ${p.max > 2 ? hyper.wire()`
        <li>
          <a class="${`pagination-link${p.c === p.max ? ' is-current' : ''}`}" data-id="${p.id}" data-f="${p.c < p.max ? p.c + 1 : p.max}" onclick=${loadChannel}>(${p.c < p.max ? p.c + 1 : p.max})</a>
        </li>
      ` : ''}
    `}
  `
}

function iconsRender (i) {
  return hyper.wire()`
    <button onclick=${i.a} title="${i.n}" style=${{ backgroundImage: i.u ? `url(${i.u})` : undefined }}>
      <span>${i.s}</span>
    </button>
  `
}

function loadMessages (p, m, u, r, scroll) {
  var messages = m.sort((a, b) => {
    return (a.t || a.timestamp) - (b.t || b.timestamp)
  }).reverse().slice(p.i.i * 100, ((p.i.i * 100) + 100) < m.length ? ((p.i.i * 100) + 100) : undefined).reverse()
  var max = Math.ceil(m.length / 100)

  if (!scroll && messages.length === 0) {
    console.log('Resetting.')
    p.i.i = 0 // Reset functionality. Just a temporary fix.
    messages = m.sort((a, b) => { // Re-calculate
      return (a.t || a.timestamp) - (b.t || b.timestamp)
    }).reverse().slice(p.i.i * 100, ((p.i.i * 100) + 100) < m.length ? ((p.i.i * 100) + 100) : undefined).reverse()
  }
  console.log(p, messages, scroll, messages.length, max)
  if (messages.length > 0) {
    if ((p.i.i === 0) || p.w === 'below') {
      document.getElementById('messages').appendChild(hyper.wire()`
        <div data-set="${p.i.i}">
          ${messages.map(m => messageRender(m, u, r))}
          ${p.i.i > 0 ? hyper.wire()`<hr>` : ''}
        </div>
      `)
      if (document.querySelectorAll('[data-set]').length > 1) document.getElementById('messages').scrollTop = p.s - (p.s - (p.s / 1.1))
      else if (p.i.i > 0) {
        console.log('No')
        loadMessages({ i: { i: cacheChannels[loading][p.i.f][p.c].i - 1, f: p.i.f }, c: p.c }, m, u, r)
      }
      if (document.querySelectorAll('[data-set]').length > 3) document.getElementById('messages').removeChild(document.getElementById('messages').firstChild)
    } else if (p.w === 'above') {
      document.getElementById('messages').insertBefore(hyper.wire()`
        <div data-set="${p.i.i}">
          ${messages.map(m => messageRender(m, u, r))}
          ${p.i.i > 0 ? hyper.wire()`<hr>` : ''}
        </div>
      `, document.getElementById('messages').firstChild)
      document.getElementById('messages').scrollTop = (document.getElementById('messages').scrollHeight - p.s)
      if (document.querySelectorAll('[data-set]').length > 3) document.getElementById('messages').removeChild(document.getElementById('messages').lastChild)
    } else {
      document.getElementById('messages').appendChild(hyper.wire()`
        <div data-set="${p.i.i}">
          ${messages.map(m => messageRender(m, u, r))}
          ${p.i.i > 0 ? hyper.wire()`<hr>` : ''}
        </div>
      `)
      // document.getElementById('messages').scrollTop = cacheChannels[loading][p.i.f][p.c].w
    }
    document.getElementById('messages').onscroll = null
    document.getElementById('messages').onscroll = () => {
      if (p.i.i < max && document.getElementById('messages').scrollTop === 0) {
        cacheChannels[loading][p.i.f][p.c].i += 1
        cacheChannels[loading][p.i.f][p.c].w = document.getElementById('messages').scrollTop
        loadMessages({ i: { i: cacheChannels[loading][p.i.f][p.c].i, f: p.i.f }, c: p.c, w: 'above', s: document.getElementById('messages').scrollHeight }, m, u, r, true)
      } else if (cacheChannels[loading][p.i.f][p.c].i > 0 && document.getElementById('messages').scrollTop > document.getElementById('messages').scrollHeight / 1.1) {
        cacheChannels[loading][p.i.f][p.c].i -= 1
        cacheChannels[loading][p.i.f][p.c].w = document.getElementById('messages').scrollTop
        if (!document.querySelector(`[data-set="${cacheChannels[loading][p.i.f][p.c].i}"]`)) loadMessages({ i: { i: cacheChannels[loading][p.i.f][p.c].i, f: p.i.f }, c: p.c, w: 'below', s: document.getElementById('messages').scrollHeight }, m, u, r, true)
      }
    }
    if (p.i.i === 0 && !document.querySelector(`[data-set="1"]`)) document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight
  }
}

function loadChannel (m = new MouseEvent()) {
  var c = m.target.dataset.id
  var f = Number.isNaN(Number(m.target.dataset.f)) ? 0 : Number(m.target.dataset.f)
  if (!cacheChannels[loading]) cacheChannels[loading] = []
  if (!cacheChannels[loading][f]) cacheChannels[loading][f] = {}
  if (!cacheChannels[loading][f][c]) cacheChannels[loading][f][c] = { i: 0, f: 0 }
  if (typeof f === 'number') cacheChannels[loading][f][c].f = f

  console.log(loading, c, f, cacheChannels[loading][f][c], cacheFiles[loading].fi[c])
  var fReader = new FileReader()
  fReader.addEventListener('load', json => {
    var p = JSON.parse(json.target.result)

    var backwardsCompat = {
      name: p.c ? p.c.n : (p.n || p.name),
      topic: p.c ? p.c.to : (p.to || p.topic),
      m: p.m || p.messages,
      u: p.u || p.users,
      r: p.r || p.roles,
      g: p.g || p.guild
    }
    if (!Object.keys(backwardsCompat.r).length > 0) backwardsCompat.r = undefined
    document.getElementById('channelname').innerHTML = `# ${backwardsCompat.name || `${Object.entries(p.u)[0][1].n} & ${Object.entries(p.u)[1][1].n}`}`
    document.getElementById('channeltopic').innerHTML = String(backwardsCompat.topic ? backwardsCompat.topic : (backwardsCompat.g ? '' : p.m ? `${Object.entries(p.u)[0][1].tg} & ${Object.entries(p.u)[1][1].tg}` : '')).substr(0, 101)
    document.getElementById('channeltopic').title = backwardsCompat.topic ? backwardsCompat.topic : (backwardsCompat.g ? '' : p.m ? `${Object.entries(p.u)[0][1].tg} & ${Object.entries(p.u)[1][1].tg}` : '')
    if (document.getElementById('channeltopic').innerText.length > 99) document.getElementById('channeltopic').innerHTML += '...'
    if (document.getElementById('channeltopic').innerText.length < 2) document.getElementById('channeltopic').classList.add('is-hidden')
    else document.getElementById('channeltopic').classList.remove('is-hidden')

    document.getElementById('messages').innerHTML = ''
    // cacheChannels[loading][f][c].i--
    console.log(cacheChannels[loading][f][c].i)
    loadMessages({i: cacheChannels[loading][f][c], c}, backwardsCompat.m, backwardsCompat.u, backwardsCompat.r)

    document.getElementById('members').querySelector('.menu-list').classList.remove('is-hidden')
    hyper.bind(document.getElementById('members').querySelector('.menu-list'))`
      ${Object.entries(backwardsCompat.u).map(u => memberRender(u[1], backwardsCompat.r))}
    `

    document.getElementById('members').querySelector('.menu-label').innerText = `Members - ${Object.entries(backwardsCompat.u).length}`

    document.getElementById('pagination').classList.remove('is-hidden')
    hyper.bind(document.getElementById('pagination'))`
      ${paginationRender({id: c, c: cacheChannels[loading][f][c].f, max: cacheFiles[loading].fi[c].length - 1})}
    `
  })
  fReader.addEventListener('progress', renderProgressModal)
  fReader.addEventListener('loadend', () => {
    document.querySelector('.modal').classList.remove('is-active')
  })
  fReader.readAsText(cacheFiles[loading].fi[c][cacheChannels[loading][f][c].f].res)
}

function renderChannels (c) {
  var type = c[0].ty ? 'ty' : 'type'
  var textChannels = c.filter(c => c[type] === 'text').sort((a, b) => {
    return (a.pos || a.position) - (b.pos || b.position)
  })
  var voiceChannels = c.filter(c => c[type] === 'voice').sort((a, b) => {
    return (a.pos || a.position) - (b.pos || b.position)
  })
  hyper.bind(document.getElementById('channels'))`
    <p class="menu-label">Text Channels</p>
    <ul class="menu-list">
      ${textChannels.map(c => hyper.wire()`
        <li><a data-id="${c.i || c.id}" onclick=${loadChannel} >&#35; ${c.n || c.name} (${cacheFiles[loading].fi[c.i || c.id] ? (cacheFiles[loading].fi[c.i || c.id].length > 0 ? cacheFiles[loading].fi[c.i || c.id].length : '1') : '?'})</a></li>
      `)}
    </ul>
    <p class="menu-label">Voice Channels</p>
    <ul class="menu-list">
      ${voiceChannels.map(c => hyper.wire()`
        <li><a data-id="${c.i || c.id}">&#128266; ${c.n || c.name}</a></li>
      `)}
    </ul>
  `
}

function loadGuild (i) {
  console.log(i)
  var guildInfo = cacheFiles[i].f
  document.getElementById('channelname').innerHTML = ''
  document.getElementById('channeltopic').innerHTML = ''

  document.getElementById('messages').onscroll = null
  document.getElementById('messages').innerHTML = ''

  document.getElementById('pagination').classList.remove('is-hidden')

  var backwardsCompat = {
    name: guildInfo.n || guildInfo.name,
    channels: guildInfo.c || guildInfo.channels,
    memberCount: guildInfo.m || guildInfo.memberCount
  }

  document.getElementById('members').querySelector('.menu-list').classList.add('is-hidden')
  document.getElementById('guildname').innerText = backwardsCompat.name || guildInfo.o.n
  document.getElementById('guildname').dataset.l = loading
  document.getElementById('members').querySelector('.menu-label').innerText = `Members - ${backwardsCompat.memberCount}`
  if (backwardsCompat.channels) {
    loading = Number(i)
    document.querySelector('.column.is-narrow.is-paddingless.d-server-channels-bar.has-text-white').classList.remove('is-hidden')
    renderChannels(backwardsCompat.channels)
  } else {
    loading = Number(i)
    document.querySelector('.column.is-narrow.is-paddingless.d-server-channels-bar.has-text-white').classList.add('is-hidden')
    loadChannel({ target: { dataset: { id: guildInfo.id || guildInfo.i } } })
  }
}

// Modal
function renderProgressModal (o = new ProgressEvent()) {
  document.querySelector('.modal').classList.add('is-active')
  if (typeof o === 'object') {
    var loaded = Math.round((o.loaded / o.total) * 100)
    hyper.bind(document.getElementById('modalInner'))`
      <div class="modal-content">
        <div class="card">
          <div class="card-header">
            <p class="card-header-title">Processing ${this.name}...</p>
            <p class="card-header-icon"><strong>${loaded}%</strong></p>
          </div>
          <div class="card-content">
            <progress class="progress" value="${loaded}" max="100">${loaded}%</progress>
          </div>
        </div>
      </div>
    `
  }
}

function loadGuildInfo (i) {
  var cache = cacheFiles[i]
  var files = cache.fi
  var guildFile = files.guild

  var fReader = new FileReader()
  fReader.addEventListener('load', json => {
    var p = JSON.parse(json.target.result)
    var backwardsCompat = {
      icon: p.u || p.icon,
      name: p.n || p.name
    }
    backwardsCompat.symbol = p.a ? p.a : backwardsCompat.name ? backwardsCompat.name.substr(0, 2) : p.o.n.substr(0, 2)
    sideBarButtons.unshift({
      u: backwardsCompat.icon,
      n: backwardsCompat.name || p.o.n,
      s: backwardsCompat.symbol,
      a: function () {
        loadGuild(i)
      }
    })
    renderIcons()
    cacheFiles[i].f = p
  })
  fReader.addEventListener('progress', renderProgressModal)
  fReader.addEventListener('loadend', () => {
    document.querySelector('.modal').classList.remove('is-active')
  })
  fReader.readAsText(guildFile.res)
}

function loadFile (n) {
  var progressBar = document.createElement('progress')
  progressBar.dataset.for = n
  progressBar.classList.add('progress')
  progressBar.setAttribute('max', '100')
  var fileName = document.createElement('strong')
  fileName.innerText = n
  document.querySelector('.modal-card-body').appendChild(fileName)
  document.querySelector('.modal-card-body').appendChild(progressBar)
  return currentZIP.file(n).async('blob', (m) => {
    document.getElementById('loadingfile').innerText = n
    if (m.percent.toFixed(1) > 99.9) {
      document.querySelector(`progress[data-for="${n}"]`).classList.remove('is-warning')
      document.querySelector(`progress[data-for="${n}"]`).classList.add('is-success')
    } else if (m.percent.toFixed(1) > 49.9) {
      document.querySelector(`progress[data-for="${n}"]`).classList.remove('is-danger')
      document.querySelector(`progress[data-for="${n}"]`).classList.add('is-warning')
    } else if (m.percent.toFixed(1) > 29.9) document.querySelector(`progress[data-for="${n}"]`).classList.add('is-danger')
    document.querySelector(`progress[data-for="${n}"]`).value = m.percent.toFixed(2)
    document.querySelector(`progress[data-for="${n}"]`).innerText = m.percent.toFixed(2) + '%'
  }).then(res => {
    if (n.startsWith('[CHANNEL]')) {
      if (!cacheFiles[loading].fi[n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)]) cacheFiles[loading].fi[n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)] = []
      cacheFiles[loading].fi[n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)].push({f: `${n.match(/_[0-9]+\.json/i)[0].substr(1).slice(0, -5)}`, res})
      cacheFiles[loading].fi[n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)] = cacheFiles[loading].fi[n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)].sort((a, b) => {
        return a.i - b.i
      })
    } else {
      cacheFiles[loading].fi.guild = {
        i: `${n.match(/\([0-9]+\)/i)[0].substr(1).slice(0, -1)}`,
        n: n,
        res
      }
    }
    return res
  }).catch(e => {
    throw e
  })
}

function loadSelectedFiles () {
  document.querySelector('.modal-card-foot :first-child').classList.add('is-loading')
  document.querySelector('.modal-card-foot :first-child').classList.add('is-success')
  document.querySelector('.modal-card-foot :first-child').onclick = null
  document.querySelector('.modal-card-foot :first-child').setAttribute('disabled', 'disabled')
  document.querySelector('.modal-card-foot :last-child').classList.add('is-hidden')
  var checked = []
  var elements = document.querySelectorAll('form[name="file"] input')
  for (var ind = 0; ind < elements.length; ind++) {
    var e = elements[ind]
    if (e.checked) checked.push(e.dataset.name)
  }
  hyper.bind(document.getElementById('modalInner'))`
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Loading <small id="loadingfile"></small>...</p>
      </header>
      <div class="modal-card-body"></div>
    </div>
  `
  var promises = []
  checked.forEach(i => {
    promises.push(loadFile(i))
  })
  Promise.all(promises).then(res => {
    loadGuildInfo(loading)
  })
}

function abortZIP (f, i) {
  cacheFiles.splice(i, 1)
  document.querySelector('.modal').classList.remove('is-active')
}

function chooseFilesModal (f, i) {
  hyper.bind(document.getElementById('modalInner'))`
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Choose files to load</p>
      </header>
      <div class="modal-card-body">
        <p><strong>Disclaimer:</strong> Loading huge files may hang your browser.</p>
        <form name="file">
        ${f.filter(z => (z.p.name.startsWith('[CHANNEL]') || z.p.name.startsWith('[GUILD_INFO]')) && z.p.name.endsWith('.json')).map((z, i, a) => hyper.wire()`
          <label class="checkbox">
            <input type="checkbox" data-name="${z.p.name}" checked disabled=${z.p.name.startsWith('[GUILD_INFO]') ? true : null}>
            <span title="${z.p.name + ' ' + moment(z.p.date).format()}">${z.p.name.startsWith('[CHANNEL]') ? `Channel ${z.p.name.match(/\][\S]+\(/i) ? z.p.name.match(/\][\S]+\(/i)[0].substr(1).slice(0, -1) : ''} (${z.p.name.match(/_[0-9]+\.json/i)[0].substr(1).slice(0, -5)})` : z.p.name.startsWith('[GUILD_INFO]') ? `(Required - Guild info) ${z.p.name.match(/\][\w\d ]+\(/i) ? z.p.name.match(/\][\w\d ]+\(/i)[0].substr(1).slice(0, -1) : ''}` : z.p.name}</span>\t<small><strong>~${z.p._data.uncompressedSize >= 1000000 ? Number(Number(z.p._data.uncompressedSize / 1024) / 1024).toFixed(2) + ' mb' : Number(z.p._data.uncompressedSize / 1024).toFixed(2) + ' kb'}</strong></small>
          </label>
          <br>
        `)}
        </form>
      </div>
      <div class="modal-card-foot">
        <a class="button" onclick=${loadSelectedFiles}>Load</a>
        <a class="button is-danger" onclick=${abortZIP.bind(f, i)}>Abort</a>
      </div>
    </div>
  `
}

function parseFiles () {
  cacheFiles.forEach((f, i) => {
    if (!f.r) {
      loading = i
      hyper.bind(document.getElementById('modalInner'))`
        <div class="loader"></div>
      `
      document.querySelector('.modal').classList.add('is-active')
      currentZIP = new ZIP()
      currentZIP.loadAsync(f.f)
        .then(a => {
          var f = []
          a.forEach((r, e) => {
            f.push({p: e})
          })
          chooseFilesModal(f, i)
        }).catch(e => {
          hyper.bind(document.getElementById('modalInner'))`
            <div class="modal-card">
              <header class="modal-card-head">
                <p class="modal-card-title">Error ${e.name}</p>
              </header>
              <div class="modal-card-body">
                <div class="content">
                  <h4>${e.message}</h4>
                </div>
              </div>
              <div class="modal-card-foot">
                <a onclick="javascript:document.querySelector('.modal').classList.toggle('is-active')" class="button">Acknowledge</a>
              </div>
            </div>
          `
          throw e
        })
      f.r = true
    }
  })
}

// Handle file event
function handleFileSelect (e = new Event()) {
  var fi = e.target.files
  for (var i = 0; i < fi.length; i++) {
    var f = fi[i]

    var fo = false
    cacheFiles.forEach(cF => {
      if (cF.n === `${f.name}${f.lastModified}${f.size}${f.type}`) fo = true
    })
    if (!fo) cacheFiles.push({f: f, fi: {}, r: false, n: `${f.name}${f.lastModified}${f.size}${f.type}`})
    else console.error(new Error('File already found'))
  }
  document.getElementById('files').value = ''
  if (cacheFiles.length > 0) parseFiles()
}

var uid = 0
var SRHOption = function (o = {
  n: 'Option name',
  h: 'Option help text',
  t: 'Type (toggle/select/input)',
  v: [ { n: 'Option choice 0', s: Boolean(true) } ],
  c: function (m = new MouseEvent()) {}
}) {
  this.n = o.n || ''
  this.h = o.h || ''
  this.c = o.c
  this.uid = o.uid || uid++
  this.t = o.t || 'toggle'
  this.v = o.v || [ { n: '', s: true } ]
  this.r = function () {
    return hyper.wire()`
      <div class="field">
        <label class="label">${this.n}</label>
        <div class="control">
          ${this.t === 'toggle' ? hyper.wire()`
            ${this.v.map((o, i) => hyper.wire()`
              ${i.n} <input type="checkbox" value="${i}" name="${o.n}" onchange=${this.c.bind(this)} checked=${o.s}>
            `)}
          ` : this.t === 'select' ? hyper.wire()`
            <div class="select">
              <select name="${this.n}" onchange=${this.c.bind(this)}>
                ${this.v.map((o, i) => hyper.wire()`
                  <option selected="${o.s}" value="${i}">${o.n}</option>
                `)}
              </select>
            </div>
          ` : hyper.wire()`
            <p>Error, no type selected.</p>
          `}
        </div>
        <p class="help">${this.h}</p>
      </div>
    `
  }
}

// Load settings if it exists
var loadedSettings = window.localStorage.getItem('settings')

// Default settings
var options = [
  new SRHOption({
    n: 'Theme',
    h: 'Choose a theme for the UI.',
    t: 'select',
    uid: 901,
    v: [ { n: 'Light', s: true }, { n: 'Dark', s: false } ],
    c: function (m) {
      if (typeof m === 'number' ? m > -1 : true) {
        var choice = Number(m.target ? m.target.value : m) // P = Position
        this.v.map(i => { i.s = false }) // Reset all to false.
        this.v[choice].s = true
        console.log(choice, this.v[choice])
        // Theme enable
        if (this.v[choice].n === 'Dark') {
          var dark = document.createElement('link')
          dark.id = 'dark'
          dark.type = 'text/css'
          var css = document.createTextNode(darkModeCSS)
          dark.appendChild(css)
          document.getElementsByTagName('head')[0].appendChild(dark)
        } else {
          if (document.getElementById('dark')) document.getElementById('dark').outerHTML = ''
        }
      }
    }
  })
  // ,
  // new SRHOption({
  //   n: 'Font size',
  //   h: 'Change font size of logs. Small is normal discord size. Medium & big adds extra padding.',
  //   t: 'select',
  //   uid: 902,
  //   v: [ { n: 'Small', s: true }, { n: 'Medium', s: false }, { n: 'Big', s: false } ],
  //   c: function (m) {
  //     if (typeof m === 'number' ? m > -1 : true) {
  //       var choice = Number(m.target ? m.target.value : m) // P = Position
  //       this.v.map(i => { i.s = false }) // Reset all to false.
  //       this.v[choice].s = true
  //       console.log(choice, this.v[choice])
  //       var doc = document.getElementById('misc')
  //       if (this.v[choice].n === 'Small') {
  //         // Small (Normal twitch)
  //         if (doc) doc.outerHTML = ''
  //       } else if (this.v[choice].n === 'Medium') {
  //         // Medium
  //         if (doc) doc.outerHTML = ''
  //         ;(function () {
  //           doc = document.createElement('style')
  //           doc.id = 'misc'
  //           doc.type = 'text/css'
  //           var css = document.createTextNode('div.column #logs p { font-size: 18px; padding: .5rem 0; }')
  //           doc.appendChild(css)
  //           document.getElementsByTagName('head')[0].appendChild(doc)
  //         })()
  //       } else {
  //         // Big
  //         if (doc) doc.outerHTML = ''
  //         ;(function () {
  //           doc = document.createElement('style')
  //           doc.id = 'misc'
  //           doc.type = 'text/css'
  //           var css = document.createTextNode('#logs p { font-size: 24px; padding: .7rem 0; }')
  //           doc.appendChild(css)
  //           document.getElementsByTagName('head')[0].appendChild(doc)
  //         })()
  //       }
  //     }
  //   }
  // })
]

// If there are any saved settings, load them.
if (loadedSettings) {
  var json = JSON.parse(loadedSettings)
  json.forEach(o => {
    options.forEach((op, i) => { if (op.uid === o.uid) { options[i].v = o.v; options[i].c(options[i].v.findIndex(f => f.s === true)) } })
  })
}

var sideBarButtons = [
  {
    n: 'Add archive',
    s: '+',
    a: function () {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        document.getElementById('files').click()
      } else {
        alert('The File APIs are not fully supported in this browser, please use another browser.')
      }
    }
  },
  {
    n: 'Options',
    s: '⚙',
    a: function () {
      // TODO
      alert('Will come out in a future update.')
    }
  }
]

function renderIcons () {
  hyper.bind(document.getElementById('icons'))`
    ${sideBarButtons.map(i => iconsRender(i))}
    <input type="file" id="files" name="files[]" class="is-hidden" onchange=${handleFileSelect}>
  `
}

renderIcons()
