<template>
  <div>
    <PageHeader title="Quản lý sinh viên">
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" @click="openForm()">Thêm sinh viên</v-btn></template>
    </PageHeader>
    <v-card class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" sm="4"><v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Tìm tên, mã SV, email..." density="compact" clearable @update:model-value="loadData" /></v-col>
        <v-col cols="12" sm="3"><v-select v-model="statusFilter" :items="[{title:'Tất cả',value:''},...STUDENT_STATUS_OPTIONS]" label="Trạng thái" density="compact" @update:model-value="loadData" /></v-col>
      </v-row>
    </v-card>
    <v-card>
      <v-data-table-server :headers="headers" :items="items" :items-length="total" :loading="loading" :items-per-page="pageSize" :page="page" @update:page="page=$event;loadData()" @update:items-per-page="pageSize=$event;loadData()">
        <template #item.gender="{ item }">{{ formatEnum(item.gender) }}</template>
        <template #item.status="{ item }"><StatusChip :status="item.status" /></template>
        <template #item.activeRoomNumber="{ item }"><v-chip v-if="item.activeRoomNumber" size="small" color="success" variant="tonal">{{ item.activeRoomNumber }}</v-chip><span v-else class="text-grey">—</span></template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="$router.push('/contract/students/'+item.id)"><v-icon>mdi-eye</v-icon></v-btn>
          <v-btn icon size="small" variant="text" @click="openForm(item)"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="delItem=item;delDialog.open()"><v-icon>mdi-delete</v-icon></v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="showForm" max-width="680" persistent>
      <v-card style="position: relative;">
        <!-- Close Button in Top Right of Dialog -->
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-darken-1"
          class="position-absolute top-0 right-0 ma-2"
          style="z-index: 10;"
          @click="showForm = false"
          aria-label="Đóng"
        />
        <v-card-title class="pt-5 px-6"><v-icon color="primary" class="mr-2">mdi-account</v-icon>{{ editing?'Sửa':'Thêm' }} sinh viên</v-card-title>
        <v-card-text class="px-6">
          <v-tabs v-model="formTab" color="primary" class="mb-4"><v-tab value="info">Thông tin cá nhân</v-tab><v-tab value="contact">Liên hệ</v-tab></v-tabs>
          <div v-if="formTab==='info'">
            <v-row dense>
              <v-col cols="12" sm="4" class="d-flex flex-column align-center justify-center pb-4">
                <v-hover v-slot="{ isHovering, props }">
                  <div
                    v-bind="props"
                    class="cursor-pointer elevation-2 position-relative bg-grey-lighten-3 rounded-lg border"
                    style="width: 110px; height: 147px; overflow: hidden;"
                    @click="triggerFileSelect"
                  >
                    <v-img v-if="form.avatarUrl" :src="form.avatarUrl" cover height="147" width="110" />
                    <div v-else class="d-flex flex-column align-center justify-center fill-height text-grey-darken-1">
                      <v-icon size="40">mdi-account-box</v-icon>
                      <span class="text-caption font-weight-bold mt-1">Ảnh 3x4</span>
                    </div>
                    
                    <div
                      v-if="isHovering || !form.avatarUrl"
                      class="position-absolute d-flex align-center justify-center flex-column"
                      style="bottom: 0; left: 0; right: 0; top: 0; background: rgba(0, 0, 0, 0.4); color: white; transition: background 0.2s;"
                    >
                      <v-icon size="24">mdi-camera</v-icon>
                      <span class="text-caption font-weight-medium mt-1">
                        {{ form.avatarUrl ? 'Thay đổi' : 'Tải ảnh' }}
                      </span>
                    </div>
                  </div>
                </v-hover>
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/*"
                  class="d-none"
                  @change="onFileSelected"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-row dense>
                  <v-col cols="12"><v-text-field v-model="form.studentCode" label="Mã sinh viên *" /></v-col>
                  <v-col cols="12"><v-text-field v-model="form.fullName" label="Họ tên *" /></v-col>
                </v-row>
              </v-col>
              <v-col cols="6"><v-select v-model="form.gender" :items="GENDER_OPTIONS.filter(g=>g.value!=='MIXED')" label="Giới tính *" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.dateOfBirth" label="Ngày sinh" type="date" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.citizenId" label="CCCD" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.faculty" label="Khoa" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.className" label="Lớp" /></v-col>
            </v-row>
          </div>
          <div v-if="formTab==='contact'">
            <v-row dense>
              <v-col cols="6"><v-text-field v-model="form.phoneNumber" label="SĐT" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.email" label="Email" /></v-col>
              <v-col cols="12"><v-text-field v-model="form.address" label="Địa chỉ" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.guardianName" label="Tên phụ huynh" /></v-col>
              <v-col cols="6"><v-text-field v-model="form.guardianPhone" label="SĐT phụ huynh" /></v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-5"><v-spacer /><v-btn variant="text" @click="showForm=false">Hủy</v-btn><v-btn color="primary" variant="flat" :loading="saving" @click="save">{{ editing?'Lưu':'Tạo' }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <ConfirmDialog ref="delDialog" title="Xóa sinh viên" :message="`Bạn có chắc chắn muốn xóa sinh viên <strong>${delItem?.fullName}</strong> (${delItem?.studentCode})?`" confirm-text="Xóa" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusChip from '@/shared/components/StatusChip.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import { http } from '@/shared/http'
import { formatEnum } from '@/shared/utils/formatters'
import { STUDENT_STATUS_OPTIONS, GENDER_OPTIONS } from '@/shared/utils/constants'
import { useNotify } from '@/shared/composables/useNotify'

const { success } = useNotify()
const items = ref<any[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(20)
const loading = ref(false); const search = ref(''); const statusFilter = ref('')
const showForm = ref(false); const saving = ref(false); const editing = ref(false); const editId = ref('')
const formTab = ref('info')
const form = ref({ studentCode:'',fullName:'',gender:'MALE',dateOfBirth:'',citizenId:'',faculty:'',className:'',phoneNumber:'',email:'',address:'',guardianName:'',guardianPhone:'',avatarUrl:'' })
const delItem = ref<any>(null)
const delDialog = ref()
const fileInput = ref<HTMLInputElement | null>(null)

const headers = [
  { title:'Mã SV', key:'studentCode', width:90 },{ title:'Họ tên', key:'fullName' },
  { title:'Giới tính', key:'gender', width:90 },{ title:'Khoa', key:'faculty' },
  { title:'Phòng', key:'activeRoomNumber', width:80 },{ title:'Trạng thái', key:'status', width:130 },
  { title:'', key:'actions', width:130, sortable:false },
]

function openForm(item?: any) {
  if(item){editing.value=true;editId.value=item.id;form.value={avatarUrl:'',...item}}
  else{editing.value=false;form.value={studentCode:'',fullName:'',gender:'MALE',dateOfBirth:'',citizenId:'',faculty:'',className:'',phoneNumber:'',email:'',address:'',guardianName:'',guardianPhone:'',avatarUrl:''}}
  formTab.value='info'; showForm.value=true
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.avatarUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function save() {
  saving.value=true
  try{if(editing.value)await http.put(`/api/students/${editId.value}`,form.value);else await http.post('/api/students',form.value);success('Đã lưu');showForm.value=false;loadData()}catch(e){console.error(e)}finally{saving.value=false}
}

async function doDelete() {
  try {
    await http.delete(`/api/students/${delItem.value.id}`)
    success('Đã xóa')
    loadData()
  } catch(e) {
    console.error(e)
  }
}

async function loadData() {
  loading.value=true
  try{const{data}=await http.get('/api/students',{params:{keyword:search.value,status:statusFilter.value,page:page.value,pageSize:pageSize.value}});items.value=data.items;total.value=data.totalItems}catch(e){console.error(e)}finally{loading.value=false}
}
onMounted(loadData)
</script>
