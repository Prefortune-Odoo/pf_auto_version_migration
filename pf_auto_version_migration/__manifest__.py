# -*- coding: utf-8 -*-
{
    'name': "Odoo Automatic Version Upgrade / Migration",
    'version': '12.0.1.0.0',
    'sequence': 10,
    'summary': "Migrate from Any Odoo Version to Odoo 19.0 Version — Fast, Secure & Structured",
    'description': """
                    Odoo Automatic Version Upgrade / Migration is a professional automation tool designed to simplify the upgrade process between Odoo versions.
                    Whether you are upgrading from legacy versions or moving across major releases, this module helps automate database migration, validate compatibility, and reduce downtime.
    """,
    'license': 'OPL-1',
    'author': "Prefortune Technologies LLP",
    'website': "https://www.prefortune.com/",
    'maintainer': 'Prefortune Technologies LLP',
    'support': 'odoo@prefortune.com',
    'category': 'Tools',
    'currency': 'EUR',
    'price': '0.00',
    'depends': ['base','web'],
    'data': [
        'security/ir.model.access.csv',
        'views/migration_popup_view.xml',
        'views/menu_and_action.xml',
        'views/migration_ticket_views.xml',
        'views/assets.xml'
    ],
    "images": ["static/description/banner.gif"],
    'post_init_hook': 'post_init_hook',
    'installable' : True,
    'application': True,
    'auto_install' : False,
}

