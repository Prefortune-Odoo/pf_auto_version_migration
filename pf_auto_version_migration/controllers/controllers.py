# -*- coding: utf-8 -*-
from odoo import http
import logging
import requests
from odoo import release
import platform
import base64
import os
import subprocess
import tempfile

_logger = logging.getLogger(__name__)


class PfMigrationApp(http.Controller):

    @http.route('/pf_auto_version_migration/migration/status', auth='user', type='json', methods=['POST'], csrf=False)
    def get_migration_status(self, **kwargs):

        _logger.info("get_migration_status called with kwargs: %s", kwargs)
        
        try:
            base_url = 'http://www.prefortune.com'
            api_url = f'{base_url}/migration-server/status'
            _logger.info("Calling migration status API: %s", api_url)
            
            params = {}
            params['version'] = str(release.series)
            
            custom_modules = http.request.env['ir.module.module'].search([]).filtered(
                lambda x: 'Odoo S.A.' not in x.author and 'l10' not in x.name
            )
            params['list'] = custom_modules.mapped('name')  # Convert to list of names
            
            try:
                params['ip_address'] = requests.get('https://api.ipify.org', timeout=10).text
            except Exception as ip_error:
                _logger.warning("Could not get IP address: %s", str(ip_error))
                params['ip_address'] = 'N/A'
            
            params['base_url'] = http.request.env['ir.config_parameter'].get_param('web.base.url')
            params['os_name'] = platform.system()
            
            
            response = requests.post(
                api_url,
                json={
                    'jsonrpc': '2.0',
                    'method': 'call',
                    'params': params,
                    'id': 1
                },
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            _logger.info("Migration status API response status: %s", response.status_code)
            _logger.info("Migration status API response: %s", response.text)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'status': 'success',
                    'result': data.get('result', data)
                }
            else:
                return {
                    'status': 'error',
                    'message': f'API returned status {response.status_code}'
                }
        except Exception as e:
            _logger.error("Error calling migration status API: %s", str(e), exc_info=True)
            return {
                'status': 'error',
                'message': str(e)
            }
