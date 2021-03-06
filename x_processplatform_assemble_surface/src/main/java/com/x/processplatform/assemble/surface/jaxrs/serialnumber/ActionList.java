package com.x.processplatform.assemble.surface.jaxrs.serialnumber;

import java.util.List;

import com.x.base.core.application.jaxrs.EqualsTerms;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.http.ActionResult;
import com.x.base.core.http.EffectivePerson;
import com.x.base.core.utils.SortTools;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.assemble.surface.wrapout.content.WrapOutSerialNumber;
import com.x.processplatform.core.entity.content.SerialNumber;
import com.x.processplatform.core.entity.element.Application;

 class ActionList extends ActionBase {
	ActionResult<List<WrapOutSerialNumber>> execute(EffectivePerson effectivePerson, String applicationFlag)
			throws Exception {
		ActionResult<List<WrapOutSerialNumber>> result = new ActionResult<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			EqualsTerms equals = new EqualsTerms();
			Application application = business.application().pick(applicationFlag);
			if (null == application) {
				throw new ApplicationNotExistedException(applicationFlag);
			}
			equals.put("application", application.getId());
			if (!business.application().allowControl(effectivePerson, application)) {
				throw new Exception("person{name:" + effectivePerson.getName() + "} has insufficient permissions.");
			}
			List<String> ids = business.serialNumber().listWithApplication(application);
			List<WrapOutSerialNumber> wraps = outCopier.copy(emc.list(SerialNumber.class, ids));
			this.fillProcessName(business, wraps);
			SortTools.asc(wraps, false, "processName", "name");
			result.setData(wraps);
		}
		return result;
	}

}
