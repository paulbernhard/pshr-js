import { Controller } from "stimulus"
import Sortable from "sortablejs"

export default class extends Controller {

  static targets = ["uploader", "uploads", "item", "template"]

  connect() {
    // init sortable uploads
    if (this.hasUploadsTarget) {
      this.initSortable()
    }

    // build template of uploader
    this.buildUploaderTemplate()
  }

  // refresh whole uploads
  refresh() {
    const url = this.data.get("url")

    fetch(`${url}`)
      .then(response => { return response.json() })
      .then(json => {
        this.uploadsTarget.innerHTML = ""
        this.uploadsTarget.insertAdjacentHTML("afterbegin", json.html)
      })
  }

  // add response to uploads list
  add(event) {
    const [response, status, xhr] = event.detail
    if (this.hasUploadsTarget) {
      this.uploadsTarget.insertAdjacentHTML("beforeEnd", response.html)
    }
  }

  // reload closest pshr-uploads.item target
  reload(event) {
    event.preventDefault()
    const [response, status, xhr] = event.detail
    const item = event.target.closest("[data-target*='pshr-uploads.item']")
    item.outerHTML = response.html
  }

  // delete closest pshr-uploads.item target
  // or reload when this.onDelete == "reload"
  delete(event) {
    event.preventDefault()
    if (this.onDelete == "reload") {
      this.reload(event)
    } else {
      const item = event.target.closest("[data-target*='pshr-uploads.item']")
      item.parentNode.removeChild(item)
    }
  }

  initSortable() {
    const url = this.data.get("url")
    const csrf = document.querySelector("[name='csrf-token']").content

    this.sortable = new Sortable(this.uploadsTarget, {
      // draggable: "form",
      animation: 150,
      onEnd: (event) => {
        const id = event.item.dataset.id
        const index = event.newIndex

        // post to sortable url with
        // id and new index of dragged item
        fetch(`${url}/${id}/sort`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf
          },
          body: JSON.stringify({ index: index })
        })
      }
    })
  }

  buildUploaderTemplate() {
    const template = document.createElement("template")
    template.innerHTML = this.uploaderTarget.innerHTML
    template.dataset.target = "pshr-uploads.template"
    this.element.appendChild(template)
  }

  // reset uploader to template from initial state
  resetUploader() {
    // this.uploaderTarget.innerHTML = this.templateTarget.innerHTML
  }

  // get onRemove method from data attribute
  // default: delete
  get onDelete() {
    return this.data.get("onDelete") == "reload" ? "reload" : "delete"
  }
}
