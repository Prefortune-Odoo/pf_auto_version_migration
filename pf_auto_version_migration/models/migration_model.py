# -*- coding: utf-8 -*-

from unittest import result

from stdnum import se
from odoo import models, fields ,api
from odoo import release
from odoo.exceptions import ValidationError, UserError
import requests
import platform
import logging
import json
_logger = logging.getLogger(__name__)

class MigrationWizard(models.TransientModel):
    _name = 'pf.migration.wizard'
    _description = 'Migration Wizard'

    def _get_default_version(self):
        return str(release.series)
    
    def _get_custom_app_list(self):
        # list = self.env['ir.module.module'].search([]).filtered(lambda x : 'Odoo S.A.' not in x.author and 'l10' not in x.name)
        list = self.env['ir.module.module'].search([]).filtered(lambda x : x.author not in ['Camptocamp / Odoo','Odoo', 'Odoo S.A.','l10','Odoo SA','Camptocamp','Odoo S.A., Applix BV, Droggol Infotech Pvt. Ltd.'] and 'l10' not in x.name and x.name not in ['pf_auto_version_migration', 'report_xlsx'])
        return list
      
    def _get_ip_address(self):
        try:
            response = requests.get('https://api.ipify.org',timeout=10) 
            ip_address = response.text
            return ip_address
        except requests.exceptions.RequestException as e:
            return f"Could not get public IP: {e}"
        
    def _get_url(self):
        base_url = self.env['ir.config_parameter'].get_param('web.base.url')
        _logger.info("_get_url base_url %s",base_url)
        return str(base_url)
    
    def _get_os_details(self):

        os_name = platform.system()
        format_os_name = os_name
        if os_name == 'Windows':
            format_os_name = "Running on Windows"
        elif os_name == 'Linux':
            format_os_name = "Running on Linux"
        elif os_name == 'Darwin':
            format_os_name = "Running on macOS"
        
        return format_os_name
    
    @api.model
    def _get_company_name(self):
        company = self.env.user.company_id
        return company.name if company else ''
    
    @api.model
    def _get_edition_type(self):
        try:
            # Check if enterprise modules are installed
            enterprise_modules = self.env['ir.module.module'].search([
                ('name', 'in', ['web_enterprise', 'base_enterprise']),
                ('state', '=', 'installed')
            ], limit=1)
            return 'enterprise' if enterprise_modules else 'community'
        except Exception:
            return 'community'
    
    @api.model
    def _get_number_of_users(self):
        try:
            return self.env['res.users'].search_count([('active', '=', True)])
        except Exception:
            return 0
    
    @api.model
    def _get_is_multi_company(self):
        try:
            company_count = self.env['res.company'].search_count([])
            return 'yes' if company_count > 1 else 'no'
        except Exception:
            return 'no'
    
    def dynamic_selection(self):
        try:
            current_version = int(float(release.series)) + 1
            destination_versions = 19 + 1
            list = []
            for next in range(current_version, destination_versions):
                _logger.info("next %s", next)
                list.append((f'{next}.0', f'{next}.0'))
            
            # If list is empty, add at least one option
            if not list:
                list.append(('19.0', '19.0'))
            
            return list
        except Exception as e:
            _logger.error("Error in dynamic_selection: %s", str(e))
            return [('19.0', '19.0')]
    
    active_state = fields.Selection(
        selection=[
            ('first', 'Set Version'),
            ('second', 'List Of Custom Module'),
            ('finish', 'Finish'),

        ],
        default="first"
    )

    list_of_custom_modules = fields.Many2many('ir.module.module',string="List Of Custom Moudles",default=_get_custom_app_list)
    total_list_of_custom_modules = fields.Integer(string="Total Modules To Migrate",compute="_compute_sum_need_to_migrate")
    server_ip_address = fields.Char(default=_get_ip_address)
    server_url = fields.Char(default=_get_url)

    # Basic Information
    company_name = fields.Char(string='Company Name', default=_get_company_name)
    name = fields.Char(string='Contact Person Name',)
    email = fields.Char(string='Email',)
    phone_number = fields.Char(string='Phone Number')
    whatsapp_number = fields.Char(string='WhatsApp Contact Number')
    
    # Current Odoo Setup
    current_version = fields.Char(string='Current Odoo Version', default=_get_default_version)
    edition_type = fields.Selection(
        selection=[('community', 'Community'), ('enterprise', 'Enterprise')],
        string='Community or Enterprise',
        default=_get_edition_type
    )
    hosting_type = fields.Selection(
        selection=[
            ('odoo_sh', 'Odoo.sh'),
            ('on_premise', 'On-Premise'),
            ('third_party_vps', 'Third-party VPS')
        ],
        string='Hosting Type'
    )
    vps_provider = fields.Char(string='VPS Provider Name', help='If hosting type is Third-party VPS')
    server_os_name = fields.Char(string='Server OS', default=_get_os_details)
    # destination_version = fields.Selection(
    #     selection=lambda x : x.dynamic_selection(),
    #     string='Target Version',
    #     required=True,
    # )
    destination_version = fields.Char(
        string='Target Version',
        default='19.0',
        readonly=True
    )
    migration_timeline = fields.Text(string='Migration Timeline / Urgency')
    
    # Database Details
    database_name = fields.Char(string='Database Name')
    database_size = fields.Char(string='Database Size')
    number_of_users = fields.Integer(string='Number of Users', default=_get_number_of_users)
    is_multi_company = fields.Selection(
        selection=[('yes', 'Yes'), ('no', 'No')],
        string='Multi-company?',
        default=_get_is_multi_company
    )
    
    # Customization Information
    list_of_custom_modules = fields.Many2many('ir.module.module', string='Custom Modules', default=_get_custom_app_list)
    total_list_of_custom_modules = fields.Integer(string='Total Custom Modules', compute="_compute_sum_need_to_migrate")
    third_party_apps = fields.Text(string='Third-party Apps Installed')
    core_code_modifications = fields.Text(string='Core Code Modifications')
    
    # Integrations
    payment_gateways = fields.Text(string='Payment Gateways')
    ecommerce_platforms = fields.Text(string='E-commerce Platforms')
    shipping_apis = fields.Text(string='Shipping APIs')
    accounting_integrations = fields.Text(string='Accounting Integrations')
    external_system_apis = fields.Text(string='External System APIs')
    
    # Access (Shared Securely After Ticket Creation)
    server_ssh_rdp_access = fields.Text(string='Server SSH / RDP Access')
    odoo_admin_access = fields.Text(string='Odoo Admin Access')
    repository_access = fields.Text(string='Repository Access (if Odoo.sh or Git-based)')
    
    # Optional but Helpful
    latest_backup_available = fields.Selection(
        selection=[('yes', 'Yes'), ('no', 'No')],
        string='Latest Backup Available?'
    )
    preferred_downtime_window = fields.Text(string='Preferred Downtime Window')
    current_known_issues = fields.Text(string='Current Known Issues')
    
    # Additional fields
    po_number = fields.Char(string='Purchase Number')
    server_ip_address = fields.Char(default=_get_ip_address)
    server_url = fields.Char(default=_get_url)

    def _compute_sum_need_to_migrate(self):
        for res in self:
            res.total_list_of_custom_modules = len(res.list_of_custom_modules)

    @api.model
    def default_get(self, fields_list):
        res = super(MigrationWizard, self).default_get(fields_list)
        _logger.info("default_get called for MigrationWizard %s",res)
        
        # Ensure selection fields have valid values
        if 'edition_type' in fields_list and not res.get('edition_type'):
            res['edition_type'] = self._get_edition_type()
        if 'is_multi_company' in fields_list and not res.get('is_multi_company'):
            res['is_multi_company'] = self._get_is_multi_company()
        if 'number_of_users' in fields_list and not res.get('number_of_users'):
            res['number_of_users'] = self._get_number_of_users()
        
        return res

    def action_next_step(self):
        _logger.info("self.active_state %s",self.active_state)

        # 1️⃣ Database Name
        db_name = self.env.cr.dbname

        # 2️⃣ Database Size
        self.env.cr.execute("""
            SELECT pg_size_pretty(pg_database_size(%s))
        """, (db_name,))
        db_size = self.env.cr.fetchone()[0]

        _logger.info("Database Name: %s", db_name)
        _logger.info("Database Size: %s", db_size)
        self.database_size = db_size
        self.database_name = db_name
        
        if self.active_state == 'first':
            self.active_state = 'second'
        elif self.active_state == 'second':
            self.active_state = 'finish'
        else:
            gmail_url = (
                "https://mail.google.com/mail/?view=cm&fs=1&to=support@example.com"
                "&su=Odoo%20Migration%20Request"
                "&body=Hello%20Support%20Team%2C%0A%0AI%20would%20like%20to%20request%20assistance%20with%20the%20Odoo%20migration%20process.%0A%0AThe%20migration%20wizard%20has%20been%20completed%20and%20I%20need%20your%20help%20to%20proceed%20with%20the%20next%20steps.%0A%0APlease%20let%20me%20know%20when%20you%20are%20available%20to%20assist.%0A%0AThank%20you%20for%20your%20support%21%0A%0ABest%20regards"
            )
            return {
                'type': 'ir.actions.act_url',
                'url': gmail_url,
                'target': 'new',
            }
        
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'pf.migration.wizard',
            'view_mode': 'form',
            'res_id': self.id,
            'target': 'new',
        }
    
    def action_create_ticket(self):
        """Create a migration ticket from wizard data"""
        if not self.name:
            raise ValidationError("Please fill Name field!")
        
        if not self.email:
            raise ValidationError("Please fill Email Address field!")
        
        if not self.po_number:
            raise ValidationError("Please fill Purchase Number field!")
        
        # Use the server URL from config or default to localhost
        base_url = self.env['ir.config_parameter'].get_param('web.base.url', 'http://www.prefortune.com')
        base_url = 'http://www.prefortune.com'
        url = f'{base_url}/migration-server/create/ticket'
        
        # Get module names as list
        modules_list = self.list_of_custom_modules.mapped('name') if self.list_of_custom_modules else []
        
        post_data = {
            # Basic Information
            'company_name': self.company_name or '',
            'name': self.name or '',
            'email': self.email or '',
            'phone_number': self.phone_number or '',
            'whatsapp_number': self.whatsapp_number or '',
            # Current Odoo Setup
            'current_version': self.current_version or '',
            'edition_type': self.edition_type or '',
            'hosting_type': self.hosting_type or '',
            'vps_provider': self.vps_provider or '',
            'server_os_name': self.server_os_name or '',
            'destination_version': self.destination_version or '',
            'migration_timeline': self.migration_timeline or '',
            # Database Details
            'database_name': self.database_name or '',
            'database_size': self.database_size or '',
            'number_of_users': self.number_of_users or 0,
            'is_multi_company': self.is_multi_company or '',
            # Customization
            'total_list_of_custom_modules': self.total_list_of_custom_modules or 0,
            'modules_list': modules_list,
            'third_party_apps': self.third_party_apps or '',
            'core_code_modifications': self.core_code_modifications or '',
            # Integrations
            'payment_gateways': self.payment_gateways or '',
            'ecommerce_platforms': self.ecommerce_platforms or '',
            'shipping_apis': self.shipping_apis or '',
            'accounting_integrations': self.accounting_integrations or '',
            'external_system_apis': self.external_system_apis or '',
            # Access
            'server_ssh_rdp_access': self.server_ssh_rdp_access or '',
            'odoo_admin_access': self.odoo_admin_access or '',
            'repository_access': self.repository_access or '',
            # Optional
            'latest_backup_available': self.latest_backup_available or '',
            'preferred_downtime_window': self.preferred_downtime_window or '',
            'current_known_issues': self.current_known_issues or '',
            # Additional
            'po_number': self.po_number or '',
            'server_url': self.server_url or '',
            'server_ip_address': self.server_ip_address or '',
        }

        _logger.info("Post data: %s", post_data)
        _logger.info("Calling URL: %s", url)
        
        try:
            # For Odoo JSON-RPC endpoint, we need to send JSON-RPC format
            jsonrpc_payload = {
                'jsonrpc': '2.0',
                'method': 'call',
                'params': post_data,
                'id': 1
            }
            
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=jsonrpc_payload, headers=headers, timeout=30)
            _logger.info("Response status: %s", response.status_code)
            _logger.info("Response content: %s", response.text)
            
            if response.status_code == 200:
                # Parse JSON-RPC response
                json_response = json.loads(response.text)
                result = json_response.get('result', {})
                ticket_ref = result.get('ticket_ref', 'N/A')
                description = result.get('description')
                status = result.get('status', 'unknown')
                message = result.get('message', '')
                
                _logger.info("Response ticket_ref: %s", ticket_ref)

                create = {
                    'ticket_number' : ticket_ref,
                    'description'   : description
                }

                migration_ticket = self.env['pf.migration.ticket'].sudo().create(create)
                _logger.info("Created migration ticket with ID: %s, ticket_number: %s", migration_ticket.id, migration_ticket.ticket_number)
                
                if status == 'success':
                    return {
                        'type': 'ir.actions.act_window',
                        'res_model': 'pf.migration.ticket',
                        'view_mode': 'form',
                        'res_id': migration_ticket.id,
                        'context': {
                            'send_notification': True,
                            'ticket_number' : ticket_ref
                        },
                        # 'target': 'new',
                    } 
                else:
                    error_msg = result.get('message', 'Unknown error occurred')
                    raise UserError(f"Failed to create ticket: {error_msg}")
            else:
                raise UserError(f"Failed to create ticket. Status: {response.status_code}, Response: {response.text}")
        except requests.exceptions.RequestException as e:
            _logger.error("Error calling migration server: %s", str(e))
            raise UserError(f"Error connecting to migration server: {str(e)}")