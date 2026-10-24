  </main><!-- /.content-area -->
</div><!-- /.main-wrapper -->

<!-- Delete Confirmation Modal -->
<div class="modal-overlay" id="deleteModal">
  <div class="modal-box">
    <h3 id="deleteTitle">
      <span class="material-symbols-rounded" id="deleteIcon" style="font-size:22px;vertical-align:middle;margin-right:8px;">delete</span>
      <span id="deleteTitleText">Confirm Delete</span>
    </h3>
    <p id="deleteMsg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="deleteCancelBtn">Cancel</button>
      <button class="btn btn-danger" id="deleteConfirmBtn">Delete</button>
    </div>
  </div>
</div>

<script src="assets/js/main.js"></script>
<?php if (!empty($inlineScript)): ?>
<script><?= $inlineScript ?></script>
<?php endif; ?>
</body>
</html>
