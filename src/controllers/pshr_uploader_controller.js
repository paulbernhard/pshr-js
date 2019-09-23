import { Controller } from "stimulus"
import Rails from "@rails/ujs"

const Uppy = require("@uppy/core")
const Tus = require("@uppy/tus")
const DragDrop = require("@uppy/drag-drop")
const Informer = require("@uppy/informer")

export default class extends Controller {

  static targets = ["file", "drop", "thumb", "info", "progress", "template"]

  // handler when uploader is connected to DOM
  initialize() {
    this.form = this.element.closest("form")
    this.formSubmit = this.form.querySelector("input[type='submit']")

    // create template from initial state
    this.buildTemplate()

    this.uppy = Uppy({
        id: this.element.id,
        autoProceed: true,
        allowMultipleUploads: true,
        restrictions: {
          maxNumberOfFiles: this.maxNumberOfFiles,
          allowedFileTypes: this.whitelist,
          maxFileSize: this.maxFileSize
        },
        onBeforeFileAdded: (currentFile, files) => {
          // reset uppy before a file is added
          // this.reset()
        }
      })
      .use(DragDrop, {
        target: this.dropTarget
      })
      .use(Tus, {
        endpoint: this.data.get('endpoint'),
        chunkSize: 5*1024*1024
      })
      .use(Informer, {
        target: this.infoTarget
      })

    // starting to upload
    // remove any eventual messages from informer
    this.uppy.on("upload", (data) => {
      this.uppy.info("")
      this.formSubmit.disabled = true
    })

    // update progress bar
    this.uppy.on("upload-progress", (file, progress) => {
      this.progressHandler(file, progress)
    })

    // single upload succeeded
    // update file field for form and preview uploaded file
    this.uppy.on("upload-success", (file, response) => {
      this.successHandler(file, response)
    })

    // after all uploads finished
    // reset if form was submitted automatically
    this.uppy.on("complete", (result) => {
      this.formSubmit.disabled = false

      if (this.autoSubmit) {
        this.reset(true)
      } else {
        this.reset()
      }
    })
  }

  // handler when uploader is removed from DOM
  disconnect() {
    this.uppy.close()
  }

  // update progress with filename, percentage,
  // uploaded MB and ASCII progress bar
  progressHandler(file, progress) {
    const filename = file.name
    const percentage = parseFloat(progress.bytesUploaded / progress.bytesTotal * 100).toFixed(2)
    const sizeUploaded = (progress.bytesUploaded / 1024 / 1024).toFixed(3)
    const sizeTotal = (progress.bytesUploaded / 1024 / 1024).toFixed(3)

    const bar = document.createElement('div')
    bar.innerHTML = "~=".repeat(200)
    bar.style.cssText = `position: absolute; left: 0; bottom: 0; width: ${percentage}%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`

    if (parseInt(percentage) == 100) {
      this.infoTarget.innerHTML = `Upload finished<br>${file.id}`
    } else {
      this.infoTarget.innerHTML = `${sizeUploaded}&thinsp;/&thinsp;${sizeTotal} MB, ${percentage}%<br>uploading ${file.id}`
      this.infoTarget.appendChild(bar)
    }
  }

  successHandler(file, response) {
    // create hash for uploaded file
    const fileData = JSON.stringify({
      id: response.uploadURL,
      storage: "cache",
      metadata: {
        filename: file.name,
        size: file.size,
        mime_type: file.type
      }
    })

    // set form file target value to uploaded file hash
    this.fileTarget.value = fileData

    // submit form if this.autoSubmit
    // else preview uploaded file
    if (this.autoSubmit) {
      Rails.fire(this.form, "submit")
    } else {
      this.preview(file)
    }
  }

  // preview the uploaded file in thumb
  preview(file) {
    this.thumbTarget.innerHTML = `<span>${file.type}<br>${file.name}</span>`
    const url = URL.createObjectURL(file.data)

    if (file.type.includes("image")) {
      this.thumbTarget.innerHTML = `<img src="${url}">`
    } else if (file.type.includes("video")) {
      this.thumbTarget.innerHTML = `<video src="${url}" preload="metadata"></video>`
    } else {
      this.thumbTarget.innerHTML = `<span>${file.type}<br>${file.name}</span>`
    }
  }

  // reset the uppy instance and progress bar
  reset(hard = false) {
    this.uppy.reset()
    if (hard) {
      const template = this.templateTarget.cloneNode(true)
      this.element.innerHTML = this.templateTarget.innerHTML
      this.element.appendChild(template)
    }
  }

  buildTemplate() {
    const template = document.createElement("template")
    template.dataset.target= "pshr-uploader.template"
    template.innerHTML = this.element.innerHTML
    this.element.appendChild(template)
  }

  // getters for data settings
  // data-whitelist is a comma-seperated list of allowed mime-types
  // data-max-file-size defines a max file size in bytes
  // data-max-number-of-files sets a maximum number for multiple file uploads (currently disabled)

  get whitelist() {
    const whitelist = this.data.get('whitelist')
    return whitelist != "false" ? whitelist.split(',').map(type => type.trim()) : null
  }

  get maxNumberOfFiles() {
    const maxNumberOfFiles = this.data.get('maxNumberOfFiles')
    return maxNumberOfFiles == "false" ? null : parseInt(maxNumberOfFiles)
  }

  get maxFileSize() {
    const maxFileSize = this.data.get('maxFileSize')
    return maxFileSize != "false" ? parseInt(maxFileSize) : null
  }

  get autoSubmit() {
    return this.data.get("autoSubmit") == "true" ? true : false
  }
}
