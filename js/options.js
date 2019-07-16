'use strict'
let uID = 0

const types = {
  'CHECKBOX': 0,
  'RADIOBUTTONS': 1,
  'SELECTIONS': 2/*,
  'INPUT': 3 */
}

class DARAHOptions {
  constructor ({ uid, name, description, type, values, updateFunction, inputValidator }) {
    this.uid = uid || uID++
    this.name = name || 'Option ' + this.uid
    this.description = description
    this.type = type || types.CHECKBOX
    this.values = values
    this.updateFunction = updateFunction || new Error(`This function hasn't been set.`)
    this.inputValidator = inputValidator || this.inputValidator
  }
  inputValidator (value) {
    switch (this.type) {
      case types.CHECKBOX:
        if (typeof value === 'boolean') return true
        else {
          let error = new TypeError(`Value "${value}" for option "${this.name}" is not a valid boolean value.`)
          throw error
        }
    }
  }
  renderHTML () {
    let htmlContent
    switch (this.type) {
      case types.CHECKBOX:
        htmlContent = html`
          <div class="control">
            <input type="checkbox" name="${this.name}" onchange="${this.updateFunction.bind(this)}" checked="${this.values}">
          </div>
        `
        break
      case types.RADIOBUTTONS:
        htmlContent = html`
          <div class="control">
            ${this.values.map(value => html`
            <input type="radio" name="${this.name}" onchange="${this.updateFunction.bind(this)}" value="${value.s}">
            <label class="label">${value.name}</label>`)}
          </div>
        `
        break
      case types.SELECTIONS:
        htmlContent = html`
          <div class="select">
            <select name="${this.name}" onchange="${this.updateFunction.bind(this)}">
              ${this.values.map((value, ind) => html`
                <option selected="${value.s}" value="${ind}">${value.name}</option>
              `)}
            </select>
          </div>
        `
        break
      // case types.INPUT:
      //   htmlContent = html`
      //   `
      //   break
    }
    return html`
      <div class="field">
        <label class="label">${this.name}</label>
        <div class="control">
          ${htmlContent}
        </div>
        <p class="help">${this.description}</p>
      </div>
    `
  }
}

const options = [
  new DARAHOptions({
    uid: 0,
    name: 'Hide members list',
    description: 'Toggle to hide members list.',
    type: types.CHECKBOX,
    values: false,
    updateFunction: function (event) {
      let value = typeof event === 'boolean' ? event : event.target.checked
      if (this.inputValidator(value)) {
        if (value) {
          let hideChatMembers = document.createElement('style')
          hideChatMembers.id = 'hidechatmembers'
          let css = document.createTextNode(`#chatmembers { display: none; } #chat.is-8 { flex: unset; width: 100%; }`)
          hideChatMembers.appendChild(css)
          document.getElementsByTagName('head')[0].appendChild(hideChatMembers)
        } else if (document.getElementById('hidechatmembers')) {
          document.getElementById('hidechatmembers').outerHTML = ''
        }
        this.values = value
      }
    }
  }),
  new DARAHOptions({
    uid: 1,
    name: 'Hide channels list',
    description: 'Toggle to hide channels list.',
    type: types.CHECKBOX,
    values: false,
    updateFunction: function (event) {
      let value = typeof event === 'boolean' ? event : event.target.checked
      if (this.inputValidator(value)) {
        if (value) {
          let hideChannelsList = document.createElement('style')
          hideChannelsList.id = 'hidechannelslist'
          let css = document.createTextNode(`#channelslist { display: none; } #chat.is-8 { flex: unset; width: 100%; }`)
          hideChannelsList.appendChild(css)
          document.getElementsByTagName('head')[0].appendChild(hideChannelsList)
        } else if (document.getElementById('hidechannelslist')) {
          document.getElementById('hidechannelslist').outerHTML = ''
        }
        this.values = value
      }
    }
  })
]
// Load settings if it exists
let loadedSettings = window.localStorage.getItem('settings')
// If there are any saved settings, load them.
if (loadedSettings) {
  let json = JSON.parse(loadedSettings)
  json.forEach(o => {
    options.forEach((op, i) => {
      if (op.uid === o.uid) {
        options[i].updateFunction(o.values)
      }
    })
  })
}
