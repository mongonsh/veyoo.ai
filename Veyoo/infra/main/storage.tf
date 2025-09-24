resource "google_storage_bucket" "veyoo_outputs" {
  name     = "veyoo-outputs-${var.gcp_project_id}"
  location = "US"
  uniform_bucket_level_access = true
}