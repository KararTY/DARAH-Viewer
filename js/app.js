/**
 * TODO: FINISH MESSAGE LOADING.
 * IMPLEMENT: Message searching.
 */

let licenses = `<h3>DARAH Viewer</h3>
<h4>MIT License</h4>
<p>Copyright (c) 2019 Karar Al-Remahy</p>
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
<hr>
<h3>lighterhtml</h3>
<h4>ISC License</h4>
<p>Copyright (c) 2019, Andrea Giammarchi, @WebReflection</p>
<p>Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.</p>
<p>THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.</p>
<hr>
<h3>JSZip</h3>
<h4>MIT License</h4>
<p>Copyright (c) 2009-2016 Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso</p>
<p>Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:</p>
<p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.</p>
<hr>
<h3>Moment</h3>
<h4>MIT License</h4>
<p>Copyright (c) JS Foundation and other contributors</p>
<p>Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:</p>
<p>The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.</p>
<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.</p>
`.trim()

const { render, html } = window.lighterhtml
const ZIP = window.JSZip
const moment = window.moment

/**
 * Cached files.
 */
const cachedFiles = []

/**
 * Storage for errors.
 * [{ name: String, message: String, code?: Number, stack?: String }...]
 */
const errors = []

/**
 * Storage for message nodes.
 * [{ title: String, body: String, deny?: Function, accept?: Function }]
 */
const messages = []

/**
 * Initializes the layout of the application.
 * @param {HTMLElement} node
 */
function initializeLayout (node) {
  render(node, () => html`
    <div class="columns is-marginless is-mobile">
      <div class="has-background-dark has-text-light column is-paddingless is-narrow" id="sidebar">
      </div>
      <div class="column" id="content" style="padding-top:0;"></div>
    </div>
    <div id="modals"></div>
  `)
  sidebarIconsRenderer(document.getElementById('sidebar'))
}

/**
 * Renders the sidebar icons.
 * @param {HTMLDocument} node
 */
function sidebarIconsRenderer (node = document.getElementById('sidebar')) {
  render(node, () => html`
    ${sidebarIcons.map(i => html`<a class="icon button" onclick="${i.function}" title="${i.tooltip}" data-i="${(i.dataset && i.dataset.i) ? i.dataset.i : undefined}" style="${i.bgImg ? `background-image:url("${i.bgImg}");background-size:32px;` : i.dataset ? 'background-color:rgba(255, 255, 255, 0.2);' : undefined}"><span>${i.text.length > 2 ? i.text.substr(0, 2) + '...' : i.text}</span></a><br>`)}
    <input type="file" id="files" name="files[]" multiple class="is-hidden" onchange=${handleZIPFiles}>
  `)
}

/**
 * Show loading modal.
 * @param {{ title: String }}
 */
function loadingModal (t = {}) {
  if (t) {
    if (document.getElementById('loader')) document.getElementById('loader').outerHTML = ''
    // Display temporary loader circle.
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="loader">
        <div class="modal-background"></div>
        <div class="title loader"></div>
        <div class="modal-content is-clipped has-text-centered">
          <h1 class="title has-text-white">${t.title || 'Loading'}</h1>
        </div>
      </div>
    `)
  } else {
    document.getElementById('loader').outerHTML = ''
  }
}

/**
 * Abort ZIP file by deleting it from cachedFiles.
 * @param {Number} num
 */
function abortZIPFile (num) {
  cachedFiles.splice(typeof num === 'number' ? num : Number(this.dataset.i), 1)
  // Reset modal content.
  document.getElementById('parsezip').outerHTML = ''
  // See if there's another ZIP file waiting for parsing.
  return parseZIPFiles('Looking for another ZIP file to parse after a successful abort.')
}

/**
 * Check if the archive exists in the cache.
 * @param {Number} i
 * @returns {Object}
 */
function archiveCheckExists (i) {
  i = Number(i)
  if (cachedFiles[i]) return cachedFiles[i]
  else {
    let error = new Error("That archive doesn't exist. Maybe deleted?")
    errors.push(error)
    toggleErrorModal()
    throw error
  }
}

/**
 * Displays a message from the 'messages' array.
 */
function toggleMessageModal () {
  if (messages.length === 0) {
    document.getElementById('message').outerHTML = ''
  } else {
    let message = messages.splice(0, 1)[0] // Remove from storage.
    console.log(message.body || message)
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="message">
        <div class="modal-background" onclick="${message.deny || toggleMessageModal}"></div>
        <div class="modal-card">
          ${message.title ? html`
            <header class="modal-card-head">
              <p class="modal-card-title">${message.title}</p>
            </header>
          ` : undefined}
          <div class="modal-card-body">
            <div class="content">
              ${message.body ? html`<p>${message.body}</p>` : html`${{ html: message }}`}
            </div>
          </div>
          ${message.accept || message.deny ? html`
            <div class="modal-card-foot">
              ${message.accept ? html`<button class="button is-success" onclick="${message.accept}">Accept</button>` : undefined}
              ${message.deny ? html`<button class="button is-danger" onclick="${message.deny}">Deny</button>` : undefined}
            </div>
          ` : undefined}
        </div>
        <a class="modal-close" onclick="${message.deny || toggleMessageModal}"></a>
      </div>
    `)
  }
}

/**
 * Show channel settings modal.
 */
function channelSettingsModal () {
  let i = Number(this.dataset.i)
  if (document.getElementById('channelsettings')) {
    document.getElementById('channelsettings').outerHTML = ''
  } else {
    let archive = archiveCheckExists(i).fileList
    let channel = archive.channels.find(c => c.info.orig === Number(this.dataset.ind))
    if (channel) {
      document.getElementById('modals').appendChild(html`
        <div class="modal is-active" id="channelsettings">
          <div class="modal-background" onclick="${channelSettingsModal}"></div>
          <div class="modal-card">
            <div class="modal-card-body">
              <div class="content">
                <h3>${channel.info.n}</h3>
                ${channel.info.to ? html`<p>${channel.info.to}</p>` : undefined}
                <h3>⚙</h3>
                <p>
                  <strong>Created: </strong> <span title="${new Date(channel.info.t)}">${new Date(channel.info.t).toLocaleString()}.</span>
                  <br><strong>Type: </strong> <span>${channel.info.ty}</strong>
                  ${channel.info.i ? html`<br><strong>ID: </strong> <span>${channel.info.i}</span>` : undefined}
                  ${channel.messageFiles.length > 1 ? html`
                    <br>${channel.messageFiles.map((f, ind) => html`<a class="${'button' + (channel.selectedSplit === ind ? ' is-dark' : '')}" data-i="${i}" data-ind="${channel.info.orig}" data-f="${ind}" onclick="${loadChannel}">${'Load split ' + (ind + 1)}</a> <span> </span>`)}
                  ` : undefined}
                  <br><strong>Current split message count: </strong> <span>${channel.messageFiles[channel.selectedSplit].m.length} messages.</span>
                  ${channel.images.length > 0 ? html`<br><strong>Image count: </strong> <span>${channel.images.length} images.</span>` : undefined}
                  ${channel.videos.length > 0 ? html`<br><strong>Videos count: </strong> <span>${channel.videos.length} videos.</span>` : undefined}
                  ${channel.sounds.length > 0 ? html`<br><strong>Sounds count: </strong> <span>${channel.sounds.length} sounds.</span>` : undefined}
                  ${channel.documents.length > 0 ? html`<br><strong>Documents count: </strong> <span>${channel.documents.length} documents.</span>` : undefined}
                  ${channel.misc.length > 0 ? html`<br><strong>Miscellaneous count: </strong> <span>${channel.misc.length} misc.</span>` : undefined}
                </p>
              </div>
            </div>
          </div>
          <a class="modal-close" onclick="${channelSettingsModal}"></a>
        </div>
      `)
    }
  }
}

/**
 * Show message info modal.
 */
function messageInfoModal () {
  if (document.getElementById('messageinfo')) {
    document.getElementById('messageinfo').outerHTML = ''
  } else {
    let archive = archiveCheckExists(this.dataset.i).fileList
    let channel = archive.channels[Number(this.dataset.c)]
    let messages = channel.messageFiles[Number(this.dataset.f)].m.reverse()
    let message = messages[Number(this.dataset.ind)]
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="messageinfo">
        <div class="modal-background" onclick="${messageInfoModal}"></div>
        <div class="modal-card">
          <div class="modal-card-body">
            <div class="content">
              <pre>${JSON.stringify(message, null, 2)}</pre>
            </div>
          </div>
        </div>
        <a class="modal-close" onclick="${messageInfoModal}"></a>
      </div>
    `)
  }
}

/**
 * Load the channel's chat
 * @param {{ i: Number, c: Number, f: Number, msgCount: Number }} data
 */
function loadChat (data) {
  let archive = archiveCheckExists(data.i).fileList
  let channel = archive.channels[data.c]
  let messages = channel.messageFiles[data.f].m.reverse()
  let messageContainer = html`
    ${messages.slice(data.msgCount, 100).map((msg, ind) => html`
      <div class="media">
        <div class="media-left">
          <figure class="image is-32x32">
            <img class="is-rounded placeholder-load-me" alt="." data-i="${data.i}" data-ind="${msg.u}" onclick="${userImage}">
          </figure>
        </div>
        <div class="media-content content">
          <a onclick="${memberInfoModal}" data-i="${data.i}" data-ind="${msg.u}"><strong title="${archive.generalData.usersInfo[msg.u].tg}" style="${'color:' + getRoleColor({i: data.i, ind: getUserRoles({ i: data.i, ind: msg.u })[getUserRoles({ i: data.i, ind: msg.u }).length - 1]}) + ';'}">${archive.generalData.usersInfo[msg.u].n}</strong></a>
          <small title="${new Date(msg.t).toLocaleString() + (msg.e ? ', edited ' + new Date(msg.e).toLocaleString() : '')}">${moment(msg.t).fromNow()} ${msg.e ? `(edited)` : undefined}</small>
          <a class="button is-light is-pulled-right" onclick="${messageInfoModal}" data-i="${data.i}" data-c="${data.c}" data-f="${data.f}" data-ind="${data.msgCount + ind}">≡</a>
          <br>
          <span style="white-space:pre-wrap;">${msg.c.m}</span>
        </div>
      </div>
    `)}
    <hr>
    `
  document.getElementById('chat').appendChild(messageContainer)
}

/**
 * Load the channel.
 */
function loadChannel () {
  let i = Number(this.dataset.i)
  let f = Number(this.dataset.f)
  if (!Number.isNaN(i)) {
    let archive = archiveCheckExists(i).fileList
    let channelIndex = archive.channels.findIndex(c => c.info.orig === Number(this.dataset.ind))
    let channel = archive.channels[channelIndex]
    if (channel) {
      if (document.getElementById('channelsettings')) document.getElementById('channelsettings').outerHTML = ''
      if (Number.isNaN(f)) f = typeof channel.selectedSplit === 'number' ? channel.selectedSplit : 0
      loadingModal({ title: `Loading channel ${channel.info.n}, split ${f}...` })
      document.getElementById('chattitle').innerText = (channel.info.n.length > 16 ? channel.info.n.substr(0, 16) + '...' : channel.info.n) + `[${f + 1}]`
      document.getElementById('chatdescription').innerHTML = `<small>(⚙) ${channel.info.to ? (channel.info.to.length > 32 ? channel.info.to.substr(0, 32) + '...' : channel.info.to) : ''}</small>`
      document.getElementById('chatdescription').dataset.i = i
      document.getElementById('chatdescription').dataset.ind = channel.info.orig
      document.getElementById('chatdescription').setAttribute('href', '#')
      document.getElementById('chatdescription').onclick = channelSettingsModal
      if (!Number.isNaN(f)) channel.selectedSplit = f
      console.log(f, channel)
      if (channel.messageFiles[f].async) {
        channel.messageFiles[f].async('string').then(res => {
          channel.messageFiles[f] = JSON.parse(res)
          loadingModal(false)
          loadChat({ i, f: channel.selectedSplit, c: channelIndex, msgCount: channel.msgCount ? channel.msgCount[f] : 0 })
        })
      } else {
        loadingModal(false)
        loadChat({ i, f: channel.selectedSplit, c: channelIndex, msgCount: channel.msgCount ? channel.msgCount[f] : 0 })
      }
    } // else if ()
  }
}

/**
 * Left-side channels list in 'content'.
 * @param {Number} i
 * @returns {HTMLElement}
 */
function channelsList (i) {
  let archive = archiveCheckExists(i).fileList
  let parentChannels = archive.generalData.channels.p.filter((v, i, a) => a.map(i => i.i).indexOf(v.i) === i)
  return html`
    <aside class="menu">
      <ul class="menu-list">
        ${archive.generalData.channels.c.filter(c => typeof c.pa !== 'number').sort((a, b) => a.po - b.po).map(c => html`<li><a data-i="${i}" data-ind=${c.orig} onclick="${loadChannel}">${(c.ty === 'text' ? '#' : '🔊') + (c.n || c.orig)}</a></li>`)}
      </ul>
      <br>
      ${parentChannels.map((pc, ind) => html`
        <label class="menu-label">${pc.n}</label>
        <ul class="menu-list">
          ${archive.generalData.channels.c.filter(c => c.pa === ind).sort((a, b) => a.po - b.po).map(c => html`<li><a data-i="${i}" data-ind=${c.orig} onclick="${loadChannel}">${(c.ty === 'text' ? '#' : '🔊') + (c.n || c.orig)}</a></li>`)}
        </ul>
      `)}
    </aside>
  `
}

/**
 * Show guild info modal.
 */
function guildInfoModal () {
  let i = Number(this.dataset.i)
  if (typeof i === 'number') {
    if (document.getElementById('guildinfo')) {
      document.getElementById('guildinfo').outerHTML = ''
    } else {
      let archive = archiveCheckExists(i).fileList
      let guild = archive.generalData.guild
      document.getElementById('modals').appendChild(html`
        <div class="modal is-active" id="guildinfo">
        <div class="modal-background" onclick="${guildInfoModal}"></div>
          <div class="modal-card">
            <div class="modal-card-body">
              <figure class="image container is-128x128">
                <img class="is-rounded" src="${guild.icon}">
              </figure>
              <div class="content">
                <h3 class="has-text-centered">${guild.info.n}</h3>
                <h4 class="has-text-centered">${guild.info.a}</h4>
                <p>
                  ${guild.info.i ? html`<strong>ID: </strong> <span>${guild.info.i}</span><br>` : undefined}
                  <strong>Region: </strong> <span>${guild.info.re.replace('-', ' ').toUpperCase()}</span><br>
                  <strong>Created: </strong> <span title="${new Date(guild.info.t)}">${new Date(guild.info.t).toLocaleString()}.</span><br>
                  ${guild.info.o ? html`<strong>Owner: </strong> <a onclick="${memberInfoModal}" data-ind="${archive.generalData.usersInfo.findIndex(u => u.i === guild.info.o)}" data-i="${i}">${archive.generalData.usersInfo.find(u => u.i === guild.info.o).tg || guild.info.o}</a><br>` : undefined}
                  <strong>Total members: </strong> <span>${guild.info.m}</span><br>
                  ${guild.info.l ? html`<strong>Server is considered large by Discord.</strong><br>` : undefined}
                  <strong>Explicit content level: </strong> <span>${guild.info.e}</span><br>
                  <strong>Verification level: </strong> <span>${guild.info.v}</span><br>
                  ${guild.info.em && guild.info.em.length > 0 ? html`
                    <strong>Emojis in guild: </strong> <span>${guild.info.em.length}</span><br>
                    <strong>Emojis: </strong>
                    ${guild.info.em.map(e => html`<span class="tag">${e.n}</span> <span> </span>`)}
                  ` : undefined}
                </p>
              </div>
            </div>
          </div>
          <a class="modal-close" onclick="${guildInfoModal}"></a>
        </div>
      `)
    }
  }
}

/**
 * Get the user's roles
 * @param {{ i: Number, ind: Number }} data
 * @returns {Array}
 */
function getUserRoles (data) {
  let archive = archiveCheckExists(data.i).fileList
  let roles = archive.generalData.usersInfo[data.ind].r
  if (!roles) roles = [archive.generalData.rolesInfo.findIndex(r => r.n === '@everyone')]
  return roles
}

/**
 * Get the user's color
 * @param {{ i: Number, ind: Number }} data
 */
function getRoleColor (data) {
  let archive = archiveCheckExists(data.i).fileList
  let roleColor = archive.generalData.rolesInfo[data.ind].c
  return roleColor
}

/**
 * Shows the modal for a member's info.
 */
function memberInfoModal () {
  if (document.getElementById('userinfo')) {
    document.getElementById('userinfo').outerHTML = ''
  } else {
    let i = Number(this.dataset.i)
    let ind = Number(this.dataset.ind)
    let archive = archiveCheckExists(i).fileList
    let user = archive.generalData.usersInfo[ind]
    // TODO, add msg count for user.
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="userinfo">
        <div class="modal-background" onclick="${memberInfoModal}"></div>
        <div class="modal-card">
          <div class="modal-card-body">
            <figure class="image container is-128x128">
              <img class="is-rounded" src=" " data-i="${i}" data-ind="${ind}" onerror="${userImage}">
            </figure>
            <div class="content">
              <h3 class="has-text-centered">${user.tg}</h3>
              ${user.b ? html`<strong>Bot account</strong><br>` : undefined}
              <strong>ID: </strong><span>${user.i}</span><br>
              <strong>Roles: </strong>${getUserRoles({ i, ind }).map(i => archive.generalData.rolesInfo[i]).map(r => html`<span class="tag is-light" style="${'color:' + r.c + ';'}">${r.n}</span><span> </span>`)}<br>
              ${user.j ? html`<strong>Joined: </strong><span title="${new Date(user.j)}">${new Date(user.j).toLocaleString()}</span><br>` : undefined}
              ${user.t ? html`<strong>Created: </strong><span title="${new Date(user.t)}">${new Date(user.t).toLocaleString()}</span>` : undefined}
            </div>
          </div>
        </div>
        <a class="modal-close" onclick="${memberInfoModal}"></a>
      </div>
    `)
  }
}

/**
 * Load the user image.
 * @param {{ i: Number, ind: Number }} data
 */
function userImage (data) {
  if (data instanceof MouseEvent) data.stopPropagation()
  let element = this.dataset && this.dataset.i ? this : (this.querySelector ? this.querySelector('img') : false)
  let i = element ? Number(element.dataset.i) : data.i
  let ind = element ? Number(element.dataset.ind) : data.ind
  let archive = archiveCheckExists(i).fileList
  let user = archive.generalData.usersInfo[ind]
  if (archive.generalData.avatars.length > 0) {
    let regex = new RegExp(`Downloads/Users/${ind}(\\.png$|\\.jpg$|\\.gif$)`)
    let compressedImageIndex = archive.generalData.avatars.findIndex(file => file.name.match(regex))
    if (compressedImageIndex > -1) {
      let image = archive.generalData.avatars[compressedImageIndex]
      if (image.async) {
        image.async('base64').then(res => {
          archive.generalData.avatars[compressedImageIndex] = {
            name: image.name,
            data: `data:image/${res + image.name.split('.')[1]};base64,${res}`
          }
          element.src = archive.generalData.avatars[compressedImageIndex].data
        })
      } else element.src = image.data
    }
  } else element.src = user.a
}

/**
 * Right-side members list in 'content'.
 * @param {Number} i
 * @returns {HTMLElement}
 */
function membersList (i) {
  let archive = archiveCheckExists(i).fileList
  let roles = JSON.parse(JSON.stringify(archive.generalData.rolesInfo)).sort((a, b) => b.po - a.po).filter(r => r.h)
  roles.push(archive.generalData.rolesInfo.find(r => r.n === '@everyone'))
  roles = roles.filter(r => r.users && r.users.length > 0)
  return html`
    <aside class="menu">
      ${roles.map(r => html`
        <label class="menu-label">${r.n + ' - ' + r.users.length}</label>
        <ul class="menu-list">
          ${r.users.map(num => { return { ind: num, n: archive.generalData.usersInfo[num].n } }).sort((a, b) => (a.n && b.n ? a.n.localeCompare(b.n) : (!a.n && b.n ? 1 : (a.n && !b.n ? -1 : 0)))).map(u => html`
            <li style="${u.n ? undefined : 'color:#fff!important;background-color:rgba(0, 0, 0, 0.5);'}">
              <a data-i=${i} data-ind="${u.ind}" onclick="${memberInfoModal}">
                <div class="level is-mobile">
                  <div class="level-left">
                    <figure onclick=${userImage} class="level-item image is-32x32">
                      <img class="is-rounded placeholder-load-me" alt="." data-i="${i}" data-ind="${u.ind}">
                    </figure>
                    <span style="${'color:' + r.c + ';'}">${u.n ? (u.n.length > 16 ? u.n.substr(0, 16) + '...' : u.n) : '?'}</span>
                  </div>
                </div>
              </a>
            </li>`)}
        </ul>
      `)}
    </aside>
  `
}

/**
 * Loads the archive.
 */
function loadArchive () {
  let i = Number(this.dataset.i)
  if (typeof i === 'number') {
    let archive = archiveCheckExists(i).fileList
    loadingModal({ title: `Loading ${archive.generalData.guild.info.n}` })
    render(document.getElementById('content'), () => html`
      <nav class="navbar is-dark" style="margin:-.75rem;margin-top:0;margin-bottom:.75rem;">
        <div class="navbar-brand">
          <a class="navbar-item" title="${archive.generalData.guild.info.n}" onclick="${guildInfoModal}" data-i="${i}" href="#">${archive.generalData.guild.info.n.length > 16 ? archive.generalData.guild.info.n.substr(0, 16) + '...' : archive.generalData.guild.info.n}</a>
          <p class="navbar-item" id="chattitle"></p>
          <a class="navbar-item" id="chatdescription"></a>
        </div>
      </nav>
      <div class="columns is-mobile">
        <div class="column is-2 is-paddingless" style="max-height:calc(100vh - 3.25rem);overflow-y:auto;">${channelsList(i)}</div>
        <div class="column is-8" style="max-height:calc(100vh - 3.25rem);overflow-y:auto;" id="chat"></div>
        <div class="column is-2 is-paddingless" style="height:calc(100vh - 3.25rem);overflow-y:auto;" id="chatmembers">${membersList(i)}</div>
      </div>
    `)
    loadingModal(false)
  }
}

/**
 * Load the selected channels & files into cachedFiles[Number].fileList variable.
 * @param {MouseEvent} e
 */
function loadSelectedTypes (e) {
  let i = Number(e.target.dataset.i)
  let archive = archiveCheckExists(i)
  // Read form
  let form = document.forms['selectedTypes']
  let selectedChannels = []
  let selectedLoadImages = []
  let selectedLoadSounds = []
  let selectedLoadVideos = []
  let selectedLoadDocuments = []
  let selectedLoadMisc = []
  for (let ind = 0; ind < form.elements.length; ind++) {
    const e = form.elements[ind]
    if (!e.checked) return
    switch (e.name) {
      case 'include':
        selectedChannels.push({ po: Number(e.dataset.i), split: e.dataset.split })
        break
      case 'images':
        selectedLoadImages.push(Number(e.dataset.i))
        break
      case 'sounds':
        selectedLoadSounds.push(Number(e.dataset.i))
        break
      case 'videos':
        selectedLoadVideos.push(Number(e.dataset.i))
        break
      case 'documents':
        selectedLoadDocuments.push(Number(e.dataset.i))
        break
      case 'misc':
        selectedLoadMisc.push(Number(e.dataset.i))
        break
    }
  }
  // loadingModal(false)
  // Load ZIP file
  if (selectedChannels.length > 0) {
    // Remove non selected channels.
    let filteredChannels = this.channels.filter(channel => selectedChannels.map(o => o.po).includes(channel.info.po))
    this.channels = filteredChannels
    // Remove non selected splits.
    for (let index = 0; index < this.channels.length; index++) {
      const channel = this.channels[index]
      let filteredMessageFiles = channel.messageFiles.filter(msgFile => {
        // Filter selectedChannelSplits to currently looping channel.
        let a = selectedChannels.filter(split => split.po === channel.info.po)
        // Turn it into an array of splits.
        let b = a.map(o => o.split)
        // Get the current split number.
        let c = msgFile.name.match(/_[0-9]+\.json$/)[0].replace(/[^0-9]/g, '')
        // Check b array with current split number.
        let d = b.includes(c)
        return d
      })
      // Remove splits here.
      this.channels[index].messageFiles = filteredMessageFiles
      // Remove images here.
      if (!selectedLoadImages.includes(channel.info.po)) this.channels[index].images = []
      // Remove sounds here.
      if (!selectedLoadSounds.includes(channel.info.po)) this.channels[index].sounds = []
      // Remove videos here.
      if (!selectedLoadVideos.includes(channel.info.po)) this.channels[index].videos = []
      // Remove documents here.
      if (!selectedLoadDocuments.includes(channel.info.po)) this.channels[index].documents = []
      // Remove misc here.
      if (!selectedLoadMisc.includes(channel.info.po)) this.channels[index].misc = []
    }
    // Remove avatars
    if (!form.elements['avatars'] || !form.elements['avatars'].checked) this.generalData.avatars = []
    // Remove emojis
    if (!form.elements['emojis'] || !form.elements['emojis'].checked) this.generalData.emojis = []
    // Load them into fileList.
    archive.fileList = this
    // It's now parsed and ready to display in the sidebar.
    archive.parsed = true
    // Sort userIDs into roles.
    for (let ind = 0; ind < archive.fileList.generalData.usersInfo.length; ind++) {
      let user = archive.fileList.generalData.usersInfo[ind]
      if (user.r) {
        let role = archive.fileList.generalData.rolesInfo[user.r[user.r.length - 1]]
        if (!role.users) role.users = []
        role.users.push(ind)
      } else {
        // Deleted / Left user, maybe.
        let defaultRole = archive.fileList.generalData.rolesInfo.find(r => r.n === '@everyone')
        if (!defaultRole.users) defaultRole.users = []
        defaultRole.users.push(ind)
      }
    }
    // Add orig to all channels
    archive.fileList.generalData.channels.c.map((c, ind) => { c.orig = ind; return c })
    // Delete the ZIP file.
    archive.file = undefined
    // Clear modal.
    toggleErrorModal()
    document.getElementById('parsezip').outerHTML = ''
    // Add 'load archive' button to sidebar
    sidebarIcons.unshift({
      tooltip: `Load archive: ${archive.fileList.generalData.guild.info.n}`,
      text: archive.fileList.generalData.guild.info.a,
      function: loadArchive,
      dataset: {
        i: i + ''
      },
      bgImg: archive.fileList.generalData.guild.icon || archive.fileList.generalData.guild.info.u
    })
    sidebarIconsRenderer()
    // See if there's another ZIP file waiting for parsing.
    return parseZIPFiles('Looking for another ZIP file to parse after successful parsing.')
  } else abortZIPFile(i)
}

/**
 * Display size
 * @param {Number} size in bytes
 */
function displaySize (size) {
  return size > 1000000 ? `${((size / 1024) / 1024).toFixed(2)} mb` : `${(size / 1024).toFixed(2)} kb`
}

/**
 * Reduce algorithm
 * @param {Number} acc Accumulated amount.
 * @param {{ _data: { uncompressedSize: Number } }} cur Current amount.
 */
function reducer (acc, cur) {
  return acc + cur._data.uncompressedSize
}

/**
 * Show content of ZIP files and then decompresses user selected files.
 */
function parseZIPFiles (why) {
  for (let i = 0; i < cachedFiles.length; i++) {
    const cachedFile = archiveCheckExists(i)
    if (!cachedFile.parsed) {
      loadingModal({ title: `Loading file ${cachedFile.file.name} into memory...` })

      // Load ZIP file
      let zipFile = new ZIP()
      zipFile.loadAsync(cachedFile.file).then(content => {
        let files = Object.entries(content.files).sort((a, b) => {
          return a[1].name.localeCompare(b[1].name)
        }).map(file => file[1])

        let channels = files.filter(file => {
          if (file.name.startsWith('[CHANNEL]')) return true
          else return false
        })

        loadingModal({ title: `Decompressing [INFO]channels.json into readable text...` })

        zipFile.file('[INFO]channels.json').async('string').then(res => {
          let channelsInfo = JSON.parse(res)
          let sortedChannels = []
          channels.forEach((channel) => {
            let channelInFile = channelsInfo.c.find(ch => ch.ty === 'text' && ch.po === Number(channel.name.match(/\([0-9]+\)/)[0].replace(/[^0-9]/g, '')))

            if (sortedChannels.findIndex(sch => sch.po === channelInFile.po) === -1) {
              try {
                sortedChannels.push({ po: channelInFile.po, channelMessages: [channel] })
              } catch (error) {
                errors.push(new Error(why))
                throw error
              }
            } else sortedChannels[sortedChannels.findIndex(sch => sch.po === channelInFile.po)].channelMessages.push(channel)
          })
          let parsedChannelsInfo = sortedChannels.map(i => {
            let firstFile = i.channelMessages[0]
            let channel = channelsInfo.c.find(channel => channel.ty === 'text' && channel.po === Number(firstFile.name.match(/\([0-9]+\)/)[0].replace(/[^0-9]/g, '')))
            let channelFiles = files.filter(file => file.name.includes(`Downloads/Channels/${channel.po}/`) && file.name.replace(`Downloads/Channels/${channel.po}/`, '').length > 0)
            let returnObject = {
              name: `(${channel.ty.toUpperCase()}) ${channel.n || channel.po}`,
              messageFiles: i.channelMessages,
              info: channel,
              images: [],
              sounds: [],
              videos: [],
              documents: [],
              misc: []
            }
            if (channelFiles.length > 0) {
              for (let i = 0; i < channelFiles.length; i++) {
                const file = channelFiles[i]
                if (file.name.toLowerCase().match(/\.png$|\.jpg$|\.gif$/)) {
                  returnObject.images.push(file)
                } else if (file.name.toLowerCase().match(/\.wav$|\.mp3$|\.aac$/)) {
                  returnObject.sounds.push(file)
                } else if (file.name.toLowerCase().match(/\.mp4$|\.webm$|\.avi$/)) {
                  returnObject.videos.push(file)
                } else if (file.name.toLowerCase().match(/\.pdf$|\.txt$|\.rtf$/)) {
                  returnObject.documents.push(file)
                } else returnObject.misc.push(file)
              }
            }
            return returnObject
          })
          let generalData = {
            avatars: files.filter(file => file.name.includes('Downloads/Users/') && file.name.replace('Downloads/Users/', '').length > 0),
            emojis: files.filter(file => file.name.includes('Downloads/Emojis/') && file.name.replace('Downloads/Emojis/', '').length > 0),
            emojisInfo: files.find(file => file.name === '[INFO]emojis.json'),
            usersInfo: files.find(file => file.name === '[INFO]users.json'),
            rolesInfo: files.find(file => file.name === '[INFO]roles.json'),
            channels: channelsInfo,
            guild: {
              icon: files.find(file => file.name.includes('Downloads/Guild/icon')),
              emojis: files.filter(file => file.name.includes('Downloads/Guild/') && file.name.replace('Downloads/Guild/', '').length > 0 && !file.name.includes('Downloads/Guild/icon')),
              info: files.find(file => file.name.includes('[INFORMATION]'))
            }
          }

          loadingModal({ title: `Decompressing guild info, emojis info, users info, roles info and guild icon...` })

          let prom = []
          // Load guild info
          prom.push(new Promise((resolve, reject) => {
            generalData.guild.info.async('string').then(res => {
              generalData.guild.info = JSON.parse(res)
              resolve()
            }).catch(reject)
          }))

          // Load guild icon if it exists.
          if (generalData.guild.icon) {
            prom.push(new Promise((resolve, reject) => {
              generalData.guild.icon.async('base64').then(res => {
                generalData.guild.icon = `data:image/${generalData.guild.icon.name.split('.')[1]};base64,${res}`
                resolve()
              }).catch(reject)
            }))
          }

          // Load emojisInfo if it exists
          if (generalData.emojisInfo) {
            prom.push(new Promise((resolve, reject) => {
              generalData.emojisInfo.async('string').then(res => {
                generalData.emojisInfo = JSON.parse(res)
                resolve()
              }).catch(reject)
            }))
          }

          // Load usersInfo if it exists
          if (generalData.usersInfo) {
            prom.push(new Promise((resolve, reject) => {
              generalData.usersInfo.async('string').then(res => {
                generalData.usersInfo = JSON.parse(res)
                resolve()
              }).catch(reject)
            }))
          }

          // Load rolesInfo if it exists
          if (generalData.rolesInfo) {
            prom.push(new Promise((resolve, reject) => {
              generalData.rolesInfo.async('string').then(res => {
                generalData.rolesInfo = JSON.parse(res)
                resolve()
              }).catch(reject)
            }))
          }

          Promise.all(prom).then(results => {
            // Ask for a selection of files to load.
            loadingModal(false)
            document.getElementById('modals').appendChild(html`
              <div id="parsezip" class="modal is-active">
                <div class="modal-background"></div>
                <div class="modal-card">
                  <header class="modal-card-head">
                    <p class="modal-card-title">Choose content</p>
                  </header>
                  <div class="modal-card-body">
                    ${generalData.guild.info.n || (generalData.guild.icon || generalData.guild.info.u) ? html`
                      <div class="level">
                        <div class="level-left">
                          ${generalData.guild.icon || generalData.guild.info.u ? html`
                            <div class="level-item">
                              <figure class="image is-48x48">
                                <img class="is-rounded" src="${generalData.guild.icon || generalData.guild.info.u}">
                              </figure>
                            </div>
                          ` : undefined}
                          ${generalData.guild.info.n ? html`
                            <div class="level-item">
                              <h2 class="subtitle">(${generalData.guild.info.a}) ${generalData.guild.info.n}</h2>
                            </div>
                          ` : undefined}
                        </div>
                      </div>
                    ` : undefined}
                    <p>Guild created <strong>${generalData.guild.info.t ? new Date(generalData.guild.info.t).toLocaleString() : '????'}</strong>, with <strong>${generalData.guild.info.m || '????'}</strong> members. Hosted in <strong>${generalData.guild.info.re ? generalData.guild.info.re.toUpperCase() : '????'}</strong>.</p>
                    <hr>
                    <p>
                      ${generalData.guild.info._by ? html`
                        <span>Archive taken by <strong>${generalData.guild.info._by.tg}</strong> at date <strong title="${new Date(generalData.guild.info._at.t)}">${new Date(generalData.guild.info._at.t).toLocaleString()}</strong>.</span>
                        <br>
                      ` : undefined}
                      <strong>Disclaimer: ${generalData.guild.info._disclaimer}</strong>
                    </p>
                    <form id="selectedTypes">
                      <hr>
                      <h2 class="subtitle">Options</h2>
                      <hr>
                      ${generalData.avatars.reduce(reducer, 0) > 0 ? html`
                      <label class="checkbox">
                        <input type="checkbox" checked name="avatars">
                        <span title="${generalData.avatars.reduce(reducer, 0) + ' bytes.'}">Load user avatars. <small>~${displaySize(generalData.avatars.reduce(reducer, 0))}</small></span>
                      </label>` : ''}
                      ${generalData.emojis.reduce(reducer, 0) > 0 ? html`<br>
                      <label class="checkbox">
                        <input type="checkbox" checked name="emojis">
                        <span title="${generalData.emojis.reduce(reducer, 0) + ' bytes.'}">Load emojis. <small>~${displaySize(generalData.emojis.reduce(reducer, 0))}</small></span>
                      </label>` : ''}
                      <hr>
                      <h2 class="subtitle">Channels</h2>
                      <hr>
                      ${parsedChannelsInfo.map(i => html`
                        <div class="box">
                          ${i.messageFiles.map(messageFile => html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="include" data-i="${i.info.po}" data-split="${messageFile.name.match(/_[0-9]+\.json$/)[0].replace(/[^0-9]/g, '')}">
                              <span title="${messageFile._data.uncompressedSize + ' bytes.'}"><strong>${i.name} (split ${messageFile.name.match(/_[0-9]+\.json$/)[0].replace(/[^0-9]/g, '')})</strong> <small>~${displaySize(messageFile._data.uncompressedSize)}</small></span>
                            </label>
                            <br>
                          `)}
                          ${i.images.length > 0 ? html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="images" data-i="${i.info.po}">
                              <span title="${i.images.reduce(reducer, 0) + ' bytes.'}">Load image files. <small>~${displaySize(i.images.reduce(reducer, 0))}</small></span>
                            </label>
                            <br>
                          ` : undefined}
                          ${i.sounds.length > 0 ? html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="sounds" data-i="${i.info.po}">
                              <span title="${i.sounds.reduce(reducer, 0) + ' bytes.'}">Load sound files. <small>~${displaySize(i.sounds.reduce(reducer, 0))}</small></span>
                            </label>
                            <br>
                          ` : undefined}
                          ${i.videos.length > 0 ? html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="videos" data-i="${i.info.po}">
                              <span title="${i.videos.reduce(reducer, 0) + ' bytes.'}">Load video files. <small>~${displaySize(i.videos.reduce(reducer, 0))}</small></span>
                            </label>
                            <br>
                          ` : undefined}
                          ${i.documents.length > 0 ? html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="documents" data-i="${i.info.po}">
                              <span title="${i.documents.reduce(reducer, 0) + ' bytes.'}">Load document files. <small>~${displaySize(i.documents.reduce(reducer, 0))}</small></span>
                            </label>
                            <br>
                          ` : undefined}
                          ${i.misc.length > 0 ? html`
                            <label class="checkbox">
                              <input type="checkbox" checked name="misc" data-i="${i.info.po}">
                              <span title="${i.misc.reduce(reducer, 0) + ' bytes.'}">Load misc files. <small>~${displaySize(i.misc.reduce(reducer, 0))}</small></span>
                            </label>
                          ` : undefined}
                        </div>
                      `)}
                    </form>
                  </div>
                  <div class="modal-card-foot">
                    <a class="button is-success" onclick="${loadSelectedTypes.bind({ channels: parsedChannelsInfo, generalData })}" data-i="${i}">Load</a>
                    <a class="button is-danger" onclick="${abortZIPFile}" data-i="${i}">Abort</a>
                    <p><strong>Disclaimer: Loading huge files may hang your browser for a period of time. Please be patient.</strong></p>
                  </div>
                </div>
              </div>
            `)
          })
        }).catch(e => {
          cachedFiles.splice(i, 1)
          errors.push(e)
          toggleErrorModal()
        })
      }).catch(e => {
        cachedFiles.splice(i, 1)
        errors.push(e)
        toggleErrorModal()
      })
      break
    }
  }
}

/**
 * Handle file selection, making sure ZIP file's not already in cache.
 * @param {Element} e
 */
function handleZIPFiles () {
  let files = this.files
  for (var i = 0; i < files.length; i++) {
    let file = files[i]

    let found = false
    for (let i = 0; i < cachedFiles.length; i++) {
      let archive = archiveCheckExists(i)
      if (archive.name === `${file.name}${file.lastModified}${file.size}${file.type}`) {
        found = true
        break
      }
    }
    // Push ZIP file to the cached files if not found.
    if (!found) cachedFiles.push({ file, fileList: {}, parsed: false, name: `${file.name}${file.lastModified}${file.size}${file.type}` })
    else {
      errors.push(new Error('File already found!'))
      toggleErrorModal()
    }
  }
  // Parse ZIP file
  if (cachedFiles.filter(file => !file.parsed).length > 0) parseZIPFiles('Parsing a zip file by the name of ' + cachedFiles.filter(file => !file.parsed)[0].file.name)
  // Reset input
  document.getElementById('files').value = ''
}

/**
 * Displays an error from the 'errors' array.
 */
function toggleErrorModal () {
  if (errors.length === 0) {
    if (document.getElementById('error')) document.getElementById('error').outerHTML = ''
    return parseZIPFiles('Looking for another ZIP file to parse after successfully displaying an error.')
  } else {
    let error = errors.splice(0, 1)[0] // Remove from storage.
    console.error(error)
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="error">
        <div class="modal-background" onclick="${toggleErrorModal}"></div>
        <div class="modal-card">
          <header class="modal-card-head has-background-danger">
            <p class="modal-card-title has-text-white">${error.name}</p>
          </header>
          <div class="modal-card-body">
            <p>${error.message}</p>
            ${error.stack ? html`<strong>(${error.stack.match(/[\w]+\.[\w]+:[0-9]+:[0-9]+/g).join(', ')}) Error stack:</strong><pre>${error.stack.replace(/Users\/[\w]+/g, '...')}</pre>` : undefined}
          </div>
        </div>
        <a class="modal-close" onclick="${toggleErrorModal}"></a>
      </div>
    `)
  }
}

/**
 * For toggling options modal. Rendering entire content of modal, including modal-background and modal-close.
 */
function toggleOptionsModal () {
  if (document.getElementById('options')) {
    document.getElementById('options').outerHTML = ''
  } else {
    document.getElementById('modals').appendChild(html`
      <div class="modal is-active" id="options">
        <div class="modal-background" onclick="${toggleOptionsModal}"></div>
        <div class="modal-card">
          <div class="modal-card-body">
            <p>Hello world.</p>
          </div>
        </div>
        <a class="modal-close" onclick="${toggleOptionsModal}"></a>
      </div>
    `)
  }
}

/**
 * Sidebar icons
 */
const sidebarIcons = [
  {
    tooltip: 'Add archive',
    text: '+',
    function: () => { document.getElementById('files').click() }
  },
  {
    tooltip: 'Options',
    text: '⚙',
    function: toggleOptionsModal
  }
]

const options = []
// Load settings if it exists
var loadedSettings = window.localStorage.getItem('settings')
// If there are any saved settings, load them.
if (loadedSettings) {
  var json = JSON.parse(loadedSettings)
  json.forEach(o => {
    options.forEach((op, i) => {
      if (op.uid === o.uid) {
        options[i].v = o.v; options[i].c(options[i].v.findIndex(f => f.s === true))
      }
    })
  })
}

// App initialization.
initializeLayout(document.getElementById('app'))

if (!window.localStorage.getItem('acknowledgement')) {
  messages.push({
    title: 'Acknowledgements',
    body: 'D.A.R.A.H. Viewer is not affiliated with, endorsed, sponsored, or specifically approved by Discord, Discord Inc. and/or Hammer & Chisel, Inc.',
    accept: () => {
      window.localStorage.setItem('acknowledgement', true)
      return toggleMessageModal()
    },
    deny: () => {
      messages.push({
        title: 'Denied',
        body: 'You can close this page now.',
        deny: () => {
          return window.history.back()
        }
      })
      toggleMessageModal()
      return window.history.back()
    }
  })
} else console.log('D.A.R.A.H. Viewer is not affiliated with, endorsed, sponsored, or specifically approved by Discord, Discord Inc. and/or Hammer & Chisel, Inc.')
messages.push(licenses)
toggleMessageModal()