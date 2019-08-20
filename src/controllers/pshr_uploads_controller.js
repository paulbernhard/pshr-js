import { Controller } from "stimulus"
import Sortable from "sortablejs"

export default class extends Controller {

  static targets = ["uploader", "uploads"]

  connect() {
    // init sortable uploads
    if (this.hasUploadsTarget) {
      this.initSortable()
    }
  }

  // add form element to uploads list
  add(event) {
    const [response, status, xhr] = event.detail
    if (this.hasUploadsTarget) {
      this.uploadsTarget.insertAdjacentHTML("beforeEnd", response.html)
    }
  }

  // remove form element
  // method of removal can be set by data-pshr--uploads-on-remove
  // default: "delete"
  remove(event) {
    console.log(this.onRemove)
    if (this.onRemove == "reload") {
      this.reload(event)
    } else {
      this.delete(event)
    }
  }

  // reload form element
  // replace target form that triggered the event
  // with response html form
  reload(event) {
    const [response, status, xhr] = event.detail
    const form = event.target.closest("form")
    form.outerHTML = response.html
  }

  // delete form element
  delete(event) {
    event.stopPropagation()
    const form = event.target.closest("form")
    form.parentNode.removeChild(form)
  }

  initSortable() {
    const url = this.data.get("url")
    const csrf = document.querySelector("[name='csrf-token']").content

    this.sortable = new Sortable(this.uploadsTarget, {
      draggable: "form",
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

  // get onRemove method from data attribute
  // default: delete
  get onRemove() {
    return this.data.get("onRemove") == "reload" ? "reload" : "delete"
  }
}
