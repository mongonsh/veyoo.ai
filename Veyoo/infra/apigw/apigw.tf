data "google_compute_region_network_endpoint_group" "gateway_neg" {
  provider = google-beta
  name     = "gateway-service-neg"
  region   = var.gcp_region
}

resource "google_api_gateway_api" "api" {
  provider = google-beta
  api_id   = "veyoo-api"
}

resource "google_api_gateway_api_config" "api_config" {
  provider      = google-beta
  api           = google_api_gateway_api.api.api_id
  api_config_id = "veyoo-api-config"

  openapi_documents {
    document {
      path     = "openapi2-spec.yaml"
      contents = templatefile("${path.module}/openapi2-spec.yaml.tftpl", {
        backend_address = data.google_compute_region_network_endpoint_group.gateway_neg.self_link
      })
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.api_gateway.email
    }
  }
}

resource "google_api_gateway_gateway" "gateway" {
  provider      = google-beta
  api_config    = google_api_gateway_api_config.api_config.id
  gateway_id    = "veyoo-gateway"
  region        = var.gcp_region
}

resource "google_service_account" "api_gateway" {
  account_id   = "api-gateway-sa"
  display_name = "API Gateway Service Account"
}