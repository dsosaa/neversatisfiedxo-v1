# Cloudflare CSP Fix - Transform Rule Configuration
# This Terraform configuration removes Cloudflare's conflicting CSP header
# to allow the application's nonce-based CSP to function properly

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure the Cloudflare Provider
provider "cloudflare" {
  # Credentials can be set via environment variables:
  # CLOUDFLARE_API_TOKEN or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY
}

# Data source to get the zone ID for videos.neversatisfiedxo.com
data "cloudflare_zones" "domain" {
  filter {
    name = "videos.neversatisfiedxo.com"
  }
}

# Local values for reusability
locals {
  zone_id     = data.cloudflare_zones.domain.zones[0].id
  domain_name = "videos.neversatisfiedxo.com"
}

# Transform Rule to remove Cloudflare's conflicting CSP header
resource "cloudflare_ruleset" "remove_csp_conflict" {
  zone_id     = local.zone_id
  name        = "Remove Conflicting CSP Header"
  description = "Removes Cloudflare default CSP header to allow application CSP with nonce"
  kind        = "zone"
  phase       = "http_response_headers_transform"

  rules {
    description = "Remove Cloudflare CSP header to prevent conflict with application nonce-based CSP"
    expression  = "true"
    action      = "rewrite"
    enabled     = true

    action_parameters {
      headers {
        name      = "Content-Security-Policy"
        operation = "remove"
      }
    }

    # Optional: Add logging for debugging
    logging {
      enabled = true
    }
  }
}

# Output the rule information
output "csp_fix_rule_id" {
  value       = cloudflare_ruleset.remove_csp_conflict.id
  description = "The ID of the CSP fix transform rule"
}

output "zone_id" {
  value       = local.zone_id
  description = "The Cloudflare zone ID for videos.neversatisfiedxo.com"
}

output "domain_name" {
  value       = local.domain_name
  description = "The domain name being configured"
}

# Optional: Create a page rule for additional security (if needed)
# This can be uncommented if you need additional CSP configuration
# resource "cloudflare_page_rule" "csp_security" {
#   zone_id  = local.zone_id
#   target   = "videos.neversatisfiedxo.com/*"
#   priority = 1
#
#   actions {
#     security_level = "medium"
#   }
# }