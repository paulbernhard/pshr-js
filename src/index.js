import { Application } from "stimulus"
import { definitionsFromContext } from "stimulus/webpack-helpers"

// start a stimulus application with all controllers
// usage:
//   import start from "pshr-js"
//   start()

export default function start() {
  const application = Application.start()
  const context = require.context("./controllers", true, /_controller\.js$/)
  application.load(definitionsFromContext(context))
}
