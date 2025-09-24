resource "google_container_cluster" "primary" {
  name     = "veyoo-gke-cluster"
  location = var.gcp_region

  # We can't specify initial_node_count and autoscaling at the same time
  remove_default_node_pool = true
  initial_node_count       = 1

  timeouts {
    create = "30m"
    update = "30m"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = var.gcp_region
  cluster    = google_container_cluster.primary.name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  node_config {
    machine_type = "n1-standard-1"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
