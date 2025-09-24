resource "google_compute_network" "main" {
  name                    = "veyoo-main-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "veyoo-main-subnetwork"
  ip_cidr_range = "10.0.0.0/24"
  network       = google_compute_network.main.id
  region        = var.gcp_region
}
