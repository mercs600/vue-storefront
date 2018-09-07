<template>
  <div>
    <microcart/>
    <search-panel/>
    <wishlist/>
    <sidebar-menu/>
    <main-header/>
    <slot/>
    <main-footer/>
    <notification/>
    <sign-up/>
    <newsletter-popup/>
    <cookie-notification/>
    <offline-badge/>
    <modal-switcher/>
    <order-confirmation :orders-data="ordersData"/>
  </div>
</template>

<script>
import EventBus from '@vue-storefront/core/plugins/event-bus'

import MainHeader from 'theme/components/core/blocks/Header/Header.vue'
import MainFooter from 'theme/components/core/blocks/Footer/Footer.vue'

import Wishlist from 'theme/components/core/blocks/Wishlist/Wishlist.vue'
import Microcart from 'theme/components/core/blocks/Microcart/Microcart.vue'
import SidebarMenu from 'theme/components/core/blocks/SidebarMenu/SidebarMenu.vue'
import SearchPanel from 'theme/components/core/blocks/SearchPanel/SearchPanel.vue'

import Modal from 'theme/components/core/Modal.vue'
import Notification from 'theme/components/core/Notification.vue'
import SignUp from 'theme/components/core/blocks/Auth/SignUp.vue'
import NewsletterPopup from 'theme/components/core/NewsletterPopup.vue'
import CookieNotification from 'theme/components/core/CookieNotification.vue'
import OfflineBadge from 'theme/components/core/OfflineBadge.vue'
import ModalSwitcher from 'theme/components/core/blocks/Switcher/Language.vue'
import OrderConfirmation from 'theme/components/core/blocks/Checkout/OrderConfirmation.vue'

export default {
  data () {
    return {
      ordersData: []
    }
  },
  components: {
    MainHeader,
    MainFooter,
    Microcart,
    Wishlist,
    SearchPanel,
    SidebarMenu,
    Notification,
    Modal,
    SignUp,
    NewsletterPopup,
    CookieNotification,
    OfflineBadge,
    ModalSwitcher,
    OrderConfirmation
  },
  created () {
    EventBus.$on('offline-order-confirmation', (payload) => {
      this.ordersData = payload
      EventBus.$emit('modal-show', 'modal-order-confirmation')
    })
  }
}
</script>
